import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { hydraAdmin } from "@/lib/hydra"
import { resolveKratosId } from "@/features/auth/kratos-bridge"
import { getPublicOrigin } from "@/lib/public-origin"

// Hydra redirects the browser here with ?login_challenge=... (URLS_LOGIN).
export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get("login_challenge")
    if (!challenge) {
        return NextResponse.json({ error: "missing_login_challenge" }, { status: 400 })
    }

    try {
        const { data: loginRequest } = await hydraAdmin.getOAuth2LoginRequest({
            loginChallenge: challenge,
        })

        // Hydra already has an SSO session for this subject — accept immediately.
        if (loginRequest.skip) {
            const { data: accept } = await hydraAdmin.acceptOAuth2LoginRequest({
                loginChallenge: challenge,
                acceptOAuth2LoginRequest: { subject: loginRequest.subject },
            })
            return NextResponse.redirect(accept.redirect_to)
        }

        // Reuse the existing NextAuth/Kratos/Telegram/passkey session if present.
        const session = await auth()
        const origin = getPublicOrigin(req)

        if (session?.user?.id) {
            const subject = session.user.kratosId || (await resolveKratosId(session.user.id))
            if (subject) {
                const { data: accept } = await hydraAdmin.acceptOAuth2LoginRequest({
                    loginChallenge: challenge,
                    acceptOAuth2LoginRequest: {
                        subject,
                        remember: true,
                        remember_for: 30 * 24 * 60 * 60, // 30 days, matches NextAuth maxAge
                    },
                })
                return NextResponse.redirect(accept.redirect_to)
            }

            // Logged in but no Kratos identity (e.g. Kratos was unreachable at signup).
            // Don't bounce to /signin — the signin guard would loop the user to "/".
            // Surface it so the real cause (no kratosId / Kratos down) is visible.
            console.error("[oauth/login] session present but no kratosId subject; userId:", session.user.id)
            return NextResponse.redirect(new URL("/error?error=no_kratos_subject", origin))
        }

        // No session → run the normal sign-in, then come back here.
        const back = `/oauth/login?login_challenge=${encodeURIComponent(challenge)}`
        const signinUrl = new URL("/signin", origin)
        signinUrl.searchParams.set("next", back)
        return NextResponse.redirect(signinUrl)
    } catch (e) {
        console.error("[oauth/login] error:", e)
        const origin = getPublicOrigin(req)
        return NextResponse.redirect(new URL("/error?error=oauth_login_failed", origin))
    }
}
