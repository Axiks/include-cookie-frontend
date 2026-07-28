import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"
import { authClient } from "@/lib/auth-client"

// GET — ініціює settings flow і повертає його
export async function GET() {
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) return NextResponse.json({ error: "no_kratos_id" }, { status: 401 })

    try {
        const result = await authClient.passkeyRegistrationFlowInit(kratosId)
        return NextResponse.json(result)
    } catch (e) {
        console.error("[kratos/settings GET]", e)
        return NextResponse.json({ error: "flow_init_failed" }, { status: 500 })
    }
}

// POST — відправляє результат WebAuthn у Kratos (Kratos — єдине джерело правди для credentials)
export async function POST(req: NextRequest) {
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) return NextResponse.json({ error: "no_kratos_id" }, { status: 401 })

    const { flowId, token, body } = await req.json()
    const { status, data } = await authClient.passkeyRegistrationFlowSubmit({ flowId, token, body })
    if (status >= 400) console.error("[kratos/settings POST]", status, JSON.stringify(data))
    return NextResponse.json(data, { status })
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

    const { status, data } = await authClient.passkeyRegistrationRemove(kratosId, credentialId)
    if (status >= 400) {
        console.error("[kratos/settings DELETE]", status, JSON.stringify(data))
        return NextResponse.json(data, { status })
    }
    return NextResponse.json({ success: true })
}
