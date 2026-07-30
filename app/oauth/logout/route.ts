import { NextRequest, NextResponse } from "next/server"
import { authClient } from "@/lib/auth-client"
import { getPublicOrigin } from "@/lib/public-origin"

// Hydra redirects the browser here with ?logout_challenge=... (URLS_LOGOUT).
// Front/back-channel logout to downstream services is a later enhancement.
export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get("logout_challenge")
    if (!challenge) {
        return NextResponse.json({ error: "missing_logout_challenge" }, { status: 400 })
    }

    try {
        const accept = await authClient.hydraAcceptLogoutRequest(challenge)
        return NextResponse.redirect(accept.redirect_to)
    } catch (e) {
        console.error("[oauth/logout] error:", e)
        const origin = getPublicOrigin(req)
        return NextResponse.redirect(new URL("/", origin))
    }
}
