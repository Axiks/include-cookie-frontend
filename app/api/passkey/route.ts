import { NextRequest, NextResponse } from "next/server"
import { storePasskeyToken } from "@/lib/passkey-session"
import { findIdentityByNickname } from "@/lib/kratos-identities"
import { authClient } from "@/lib/auth-client"

// GET /api/passkey?nickname=<nickname>
// Verifies the nickname exists in Kratos and returns the tgId (used as the WebAuthn
// identifier in Kratos). The actual Kratos WebAuthn flow is initiated browser-direct
// to avoid server-side CSRF complications.
export async function GET(req: NextRequest) {
    const nickname = req.nextUrl.searchParams.get("nickname")
    if (!nickname) return NextResponse.json({ error: "nickname required" }, { status: 400 })

    const identity = await findIdentityByNickname(nickname.trim())
    if (!identity) return NextResponse.json({ error: "user_not_found" }, { status: 404 })

    return NextResponse.json({
        tgId: identity.tgId,
        kratosPublicUrl: process.env.KRATOS_PUBLIC_URL ?? "http://localhost:4433",
    })
}

// POST /api/passkey { kratosId }
// Verifies kratosId exists in Kratos (prevents spoofing) and issues a short-lived
// NextAuth verifyToken. The browser already authenticated via the Kratos WebAuthn
// browser flow; kratosId was obtained from /sessions/whoami.
export async function POST(req: NextRequest) {
    try {
        const { kratosId } = await req.json() as { kratosId: string }
        if (!kratosId) return NextResponse.json({ error: "kratosId required" }, { status: 400 })

        const identity = await authClient.getIdentity(kratosId)
        if (!identity) {
            return NextResponse.json({ error: "identity_not_found" }, { status: 401 })
        }

        const verifyToken = await storePasskeyToken(kratosId)
        return NextResponse.json({ verifyToken })
    } catch (e) {
        console.error("[passkey POST]", e)
        return NextResponse.json({ error: "passkey_error" }, { status: 500 })
    }
}
