import { NextRequest, NextResponse } from "next/server"
import { hydraAdmin } from "@/lib/hydra"
import { kratosAdmin } from "@/lib/kratos"
import { isFirstPartyClient, traitsToClaims } from "@/lib/oauth/first-party"

// Hydra redirects the browser here with ?consent_challenge=... (URLS_CONSENT).
export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get("consent_challenge")
    if (!challenge) {
        return NextResponse.json({ error: "missing_consent_challenge" }, { status: 400 })
    }

    try {
        const { data: consentRequest } = await hydraAdmin.getOAuth2ConsentRequest({
            consentChallenge: challenge,
        })

        const clientId = consentRequest.client?.client_id

        // Only auto-grant for our own (first-party) services. Unknown clients are
        // rejected by default to avoid silently leaking telegram_id / about.
        if (!isFirstPartyClient(clientId)) {
            const { data: reject } = await hydraAdmin.rejectOAuth2ConsentRequest({
                consentChallenge: challenge,
                rejectOAuth2Request: {
                    error: "consent_required",
                    error_description:
                        "Interactive consent for third-party clients is not enabled yet.",
                },
            })
            return NextResponse.redirect(reject.redirect_to)
        }

        const subject = consentRequest.subject ?? ""
        const grantScope = consentRequest.requested_scope ?? []

        // Pull canonical profile from Kratos and gate claims by granted scope.
        // `sub` is set by Hydra from the login subject — do not include it here.
        const idToken: Record<string, unknown> = {}
        try {
            const { data: identity } = await kratosAdmin.getIdentity({ id: subject })
            const claims = traitsToClaims(subject, identity)
            if (grantScope.includes("profile")) {
                idToken.nickname = claims.nickname
                idToken.preferred_username = claims.preferred_username
                idToken.name = claims.name
                idToken.picture = claims.picture
                idToken.avatar_url = claims.avatar_url
            }
            if (grantScope.includes("telegram")) {
                idToken.telegram_id = claims.telegram_id
                idToken.about = claims.about
            }
        } catch (e) {
            console.error("[oauth/consent] failed to read Kratos identity:", e)
        }

        const { data: accept } = await hydraAdmin.acceptOAuth2ConsentRequest({
            consentChallenge: challenge,
            acceptOAuth2ConsentRequest: {
                grant_scope: grantScope,
                grant_access_token_audience: consentRequest.requested_access_token_audience,
                remember: true,
                remember_for: 30 * 24 * 60 * 60,
                session: { id_token: idToken },
            },
        })
        return NextResponse.redirect(accept.redirect_to)
    } catch (e) {
        console.error("[oauth/consent] error:", e)
        return NextResponse.json({ error: "oauth_consent_failed" }, { status: 500 })
    }
}
