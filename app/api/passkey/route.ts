import { NextRequest, NextResponse } from "next/server"
import { generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { storeChallenge, consumeChallenge, storePasskeyToken } from "@/lib/passkey-session"

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost"
const ORIGIN = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function GET() {
    const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        allowCredentials: [],
        userVerification: "required",
    })

    const challengeId = randomBytes(16).toString("hex")
    storeChallenge(challengeId, options.challenge)

    return NextResponse.json({ challengeId, options })
}

export async function POST(req: NextRequest) {
    const { challengeId, assertion } = await req.json()

    const expectedChallenge = consumeChallenge(challengeId)
    if (!expectedChallenge) {
        return NextResponse.json({ error: "challenge_expired" }, { status: 400 })
    }

    const cred = await prisma.passkeyCredential.findUnique({
        where: { credentialId: assertion.id },
    })
    if (!cred) {
        return NextResponse.json({ error: "credential_not_found" }, { status: 404 })
    }

    let verification
    try {
        verification = await verifyAuthenticationResponse({
            response: assertion,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            authenticator: {
                credentialID: isoBase64URL.toBuffer(cred.credentialId),
                credentialPublicKey: Buffer.from(cred.publicKey, "hex"),
                counter: cred.signCount,
            },
            requireUserVerification: true,
        })
    } catch (e) {
        console.error("[passkey/verify]", e)
        return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    if (!verification.verified) {
        return NextResponse.json({ error: "verification_failed" }, { status: 400 })
    }

    await prisma.passkeyCredential.update({
        where: { credentialId: assertion.id },
        data: { signCount: verification.authenticationInfo.newCounter },
    })

    const user = await prisma.user.findUnique({
        where: { kratosId: cred.kratosId },
        include: { avatars: { include: { image: true } } },
    })
    if (!user) {
        return NextResponse.json({ error: "user_not_found" }, { status: 404 })
    }

    const token = await storePasskeyToken(user.id, cred.kratosId)

    return NextResponse.json({ token })
}
