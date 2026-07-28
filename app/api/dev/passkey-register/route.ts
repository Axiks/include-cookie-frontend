import { NextRequest, NextResponse } from "next/server"
import { generateRegistrationOptions, verifyRegistrationResponse } from "@simplewebauthn/server"
import { prisma } from "@/lib/prisma"
import { kratosAdmin } from "@/lib/kratos"
import { randomBytes } from "crypto"
import { storeChallenge, consumeChallenge, storePasskeyToken } from "@/lib/passkey-session"

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost"
const ORIGIN = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "http://localhost:3000"

function devGuard() {
    if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "not_found" }, { status: 404 })
    }
    return null
}

// GET /api/dev/passkey-register?nickname=xxx
// Returns a WebAuthn registration challenge.
export async function GET(req: NextRequest) {
    const guard = devGuard()
    if (guard) return guard

    const nickname = req.nextUrl.searchParams.get("nickname")?.trim() || "dev-user"

    const options = await generateRegistrationOptions({
        rpName: "P&C (Dev)",
        rpID: RP_ID,
        userID: randomBytes(8).toString("hex"),
        userName: nickname,
        userDisplayName: nickname,
        attestationType: "none",
        authenticatorSelection: {
            residentKey: "required",
            userVerification: "required",
        },
        excludeCredentials: [],
    })

    const challengeId = randomBytes(16).toString("hex")
    storeChallenge(challengeId, options.challenge)

    return NextResponse.json({ challengeId, options })
}

// POST /api/dev/passkey-register
// Body: { challengeId, nickname, registration }
// Verifies the credential, creates a Kratos identity + local User, returns a passkey session token.
export async function POST(req: NextRequest) {
    const guard = devGuard()
    if (guard) return guard

    const { challengeId, nickname, registration } = await req.json()

    const expectedChallenge = consumeChallenge(challengeId)
    if (!expectedChallenge) {
        return NextResponse.json({ error: "challenge_expired" }, { status: 400 })
    }

    let verification
    try {
        verification = await verifyRegistrationResponse({
            response: registration,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            requireUserVerification: true,
        })
    } catch (e) {
        console.error("[dev/passkey-register] verification error:", e)
        return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    if (!verification.verified || !verification.registrationInfo) {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    const { credentialPublicKey, counter } = verification.registrationInfo

    // Kratos schema requires telegram_id — use a dev placeholder to satisfy validation.
    const cleanNickname = (nickname as string)?.trim() || `dev_${randomBytes(4).toString("hex")}`
    const devTgId = `dev_${randomBytes(4).toString("hex")}`

    const { data: identity } = await kratosAdmin.createIdentity({
        createIdentityBody: {
            schema_id: "default",
            traits: { telegram_id: devTgId, nickname: cleanNickname },
        },
    })

    const user = await prisma.user.create({
        data: { kratosId: identity.id, nickname: cleanNickname },
    })

    // registration.id is the base64url credential ID — matches what the auth flow looks up.
    await prisma.passkeyCredential.create({
        data: {
            credentialId: registration.id,
            publicKey: Buffer.from(credentialPublicKey).toString("hex"),
            signCount: counter,
            kratosId: identity.id,
        },
    })

    const token = await storePasskeyToken(user.id, identity.id)

    return NextResponse.json({ token })
}
