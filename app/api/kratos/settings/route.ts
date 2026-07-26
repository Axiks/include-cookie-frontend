import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { verifyRegistrationResponse } from "@simplewebauthn/server"
import { isoBase64URL } from "@simplewebauthn/server/helpers"
import { prisma } from "@/lib/prisma"
import { kratosAdmin } from "@/lib/kratos"

const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL ?? "http://kratos:4433"
const KRATOS_ADMIN_URL = process.env.KRATOS_ADMIN_URL ?? "http://kratos:4434"
const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost"
const ORIGIN = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

// Returns a session cookie value that can be used as `Cookie: ory_kratos_session=<value>`
async function getSessionCookie(kratosId: string): Promise<string> {
    // 1. Create a one-time recovery code via Admin API
    const codeRes = await fetch(`${KRATOS_ADMIN_URL}/admin/recovery/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity_id: kratosId, expires_in: "10m" }),
    })
    if (!codeRes.ok) throw new Error(`Recovery code creation failed: ${await codeRes.text()}`)
    const { recovery_code: code, recovery_link } = await codeRes.json()

    // The admin recovery code comes with a pre-configured flow ID in recovery_link
    const flowId = new URL(recovery_link).searchParams.get("flow")
    if (!flowId) throw new Error("No flow ID in recovery_link")

    // 2. Submit the code — Kratos sets ory_kratos_session cookie on success
    const submitRes = await fetch(
        `${KRATOS_PUBLIC_URL}/self-service/recovery?flow=${flowId}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify({ method: "code", code }),
        }
    )

    const cookie = submitRes.headers.get("set-cookie") ?? ""
    const match = cookie.match(/ory_kratos_session=([^;]+)/)
    if (!match) throw new Error("Kratos did not return session cookie after recovery")
    return match[1]
}

// GET — ініціює settings flow і повертає його
export async function GET() {
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) return NextResponse.json({ error: "no_kratos_id" }, { status: 401 })

    const sessionCookie = await getSessionCookie(kratosId)

    // Browser flow is required — API flow omits WebAuthn nodes
    const flowRes = await fetch(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`, {
        headers: { "Accept": "application/json", "Cookie": `ory_kratos_session=${sessionCookie}` },
    })
    const flow = await flowRes.json()

    // Capture the CSRF cookie Kratos sets alongside the flow
    const setCookies: string[] = (flowRes.headers as any).getSetCookie?.() ??
        (flowRes.headers.get("set-cookie") ? [flowRes.headers.get("set-cookie")!] : [])
    const csrfCookieKV = setCookies
        .map(c => c.split(";")[0])
        .find(c => c.startsWith("csrf_token")) ?? ""

    const csrfNode = flow.ui?.nodes?.find((n: any) => n.attributes?.name === "csrf_token")
    const csrfToken: string = csrfNode?.attributes?.value ?? ""

    // Extract the WebAuthn registration challenge so we can verify it server-side on POST
    let webauthnChallenge: string | undefined
    const triggerNode = flow.ui?.nodes?.find((n: any) => n.attributes?.name === "webauthn_register_trigger")
    if (triggerNode?.attributes?.value) {
        try {
            const raw = JSON.parse(triggerNode.attributes.value)
            webauthnChallenge = raw.publicKey?.challenge
        } catch { /* ignore */ }
    }

    const token = JSON.stringify({ cookie: sessionCookie, csrf: csrfToken, csrfCookie: csrfCookieKV, webauthnChallenge })
    return NextResponse.json({ flow, token })
}

// POST — відправляє результат WebAuthn у Kratos і синхронізує credential у локальну БД
export async function POST(req: NextRequest) {
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) return NextResponse.json({ error: "no_kratos_id" }, { status: 401 })

    const { flowId, token, body } = await req.json()
    const { cookie, csrf, csrfCookie, webauthnChallenge } = JSON.parse(token) as {
        cookie: string; csrf: string; csrfCookie: string; webauthnChallenge?: string
    }

    const cookieHeader = [`ory_kratos_session=${cookie}`, csrfCookie].filter(Boolean).join("; ")

    const res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/settings?flow=${flowId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cookie": cookieHeader,
        },
        body: JSON.stringify({ ...body, csrf_token: csrf }),
    })

    const data = await res.json()
    if (!res.ok) {
        console.error("[kratos/settings POST]", res.status, JSON.stringify(data))
        return NextResponse.json(data, { status: res.status })
    }

    // After successful passkey registration, store the public key for discoverable login
    if (body.method === "webauthn" && body.webauthn_register && webauthnChallenge) {
        try {
            const credJSON = JSON.parse(body.webauthn_register)
            const verification = await verifyRegistrationResponse({
                response: credJSON,
                expectedChallenge: webauthnChallenge,
                expectedOrigin: ORIGIN,
                expectedRPID: RP_ID,
                requireUserVerification: false,
            })
            if (verification.verified && verification.registrationInfo) {
                const { credentialID, credentialPublicKey, counter } = verification.registrationInfo
                const credentialIdB64 = isoBase64URL.fromBuffer(credentialID)
                await prisma.passkeyCredential.upsert({
                    where: { credentialId: credentialIdB64 },
                    create: {
                        credentialId: credentialIdB64,
                        publicKey: Buffer.from(credentialPublicKey).toString("hex"),
                        signCount: counter,
                        kratosId,
                    },
                    update: {
                        publicKey: Buffer.from(credentialPublicKey).toString("hex"),
                        signCount: counter,
                    },
                })
            }
        } catch (e) {
            console.error("[kratos/settings POST] passkey sync failed:", e)
        }
    }

    return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) return NextResponse.json({ error: "no_kratos_id" }, { status: 401 })

    let credentialId: string
    try {
        const body = await req.json()
        credentialId = body.credentialId
    } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 })
    }
    if (!credentialId) return NextResponse.json({ error: "missing_credential_id" }, { status: 400 })

    let sessionCookie: string
    try {
        sessionCookie = await getSessionCookie(kratosId)
    } catch (e) {
        console.error("[kratos/settings DELETE] getSessionCookie failed:", e)
        return NextResponse.json({ error: "session_failed" }, { status: 500 })
    }

    let flow: any
    let csrfToken = ""
    let csrfCookieKV = ""
    try {
        const flowRes = await fetch(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`, {
            headers: { "Accept": "application/json", "Cookie": `ory_kratos_session=${sessionCookie}` },
        })

        if (!flowRes.ok) {
            const text = await flowRes.text()
            console.error("[kratos/settings DELETE] flow fetch failed:", flowRes.status, text)
            return NextResponse.json({ error: "flow_failed" }, { status: 500 })
        }

        flow = await flowRes.json()

        if (!flow?.id) {
            console.error("[kratos/settings DELETE] flow has no id:", JSON.stringify(flow))
            return NextResponse.json({ error: "invalid_flow" }, { status: 500 })
        }

        const setCookies: string[] = (flowRes.headers as any).getSetCookie?.() ??
            (flowRes.headers.get("set-cookie") ? [flowRes.headers.get("set-cookie")!] : [])
        csrfCookieKV = setCookies
            .map(c => c.split(";")[0])
            .find(c => c.startsWith("csrf_token")) ?? ""

        const csrfNode = flow.ui?.nodes?.find((n: any) => n.attributes?.name === "csrf_token")
        csrfToken = csrfNode?.attributes?.value ?? ""
    } catch (e) {
        console.error("[kratos/settings DELETE] flow init error:", e)
        return NextResponse.json({ error: "flow_error" }, { status: 500 })
    }

    // Kratos stores the credential ID as hex in flow nodes but as base64 in the identity config.
    // Convert base64 (standard or base64url) → hex to find the correct node value.
    const hexCredentialId = Buffer.from(
        credentialId.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
    ).toString("hex")

    const removeNodes: any[] = flow.ui?.nodes?.filter(
        (n: any) => n.attributes?.name === "webauthn_remove"
    ) ?? []
    const matchedNode = removeNodes.find(
        (n: any) => n.attributes?.value === hexCredentialId || n.attributes?.value === credentialId
    )
    const removeValue: string = matchedNode?.attributes?.value ?? hexCredentialId

    if (removeNodes.length > 0 && !matchedNode) {
        console.warn(
            "[kratos/settings DELETE] credential not matched in flow nodes.",
            "hex:", hexCredentialId,
            "available:", removeNodes.map((n: any) => n.attributes?.value)
        )
    }

    const cookieHeader = [`ory_kratos_session=${sessionCookie}`, csrfCookieKV].filter(Boolean).join("; ")

    let resData: any
    try {
        const res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/settings?flow=${flow.id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Cookie": cookieHeader,
            },
            body: JSON.stringify({ method: "webauthn", webauthn_remove: removeValue, csrf_token: csrfToken }),
        })

        resData = await res.json().catch(() => ({}))

        if (!res.ok) {
            console.error("[kratos/settings DELETE] settings submit failed:", res.status, JSON.stringify(resData))
            return NextResponse.json(resData, { status: res.status })
        }
    } catch (e) {
        console.error("[kratos/settings DELETE] settings submit error:", e)
        return NextResponse.json({ error: "submit_error" }, { status: 500 })
    }

    try {
        const { data: identity } = await kratosAdmin.getIdentity({
            id: kratosId,
            includeCredential: ["webauthn"],
        })
        const config = identity.credentials?.webauthn?.config as { credentials?: { id: string }[] } | undefined
        const remainingIds = new Set((config?.credentials ?? []).map(c => c.id))

        await prisma.passkeyCredential.deleteMany({
            where: {
                kratosId,
                NOT: { credentialId: { in: [...remainingIds] } },
            },
        })
    } catch (e) {
        console.error("[kratos/settings DELETE] prisma sync failed:", e)
    }

    return NextResponse.json({ success: true })
}
