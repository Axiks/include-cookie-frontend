import { NextRequest, NextResponse } from "next/server"
import { findIdentityByNickname } from "@/lib/kratos-identities"

const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL ?? "http://kratos:4433"

function getSetCookies(headers: Headers): string[] {
    return (headers as any).getSetCookie?.() ??
        (headers.get("set-cookie") ? [headers.get("set-cookie")!] : [])
}

export async function GET(req: NextRequest) {
    const nickname = req.nextUrl.searchParams.get("nickname")
    if (!nickname) return NextResponse.json({ error: "nickname required" }, { status: 400 })

    // Look up tgId from Kratos so the user doesn't need to know their Telegram ID
    const identity = await findIdentityByNickname(nickname)
    if (!identity?.tgId) return NextResponse.json({ error: "user_not_found" }, { status: 404 })
    const user = { tgId: identity.tgId }

    // Step 1: Create a browser login flow
    const flow1Res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login/browser`, {
        headers: { "Accept": "application/json" },
    })
    const flow1 = await flow1Res.json()
    const csrfCookieKV = getSetCookies(flow1Res.headers)
        .map(c => c.split(";")[0])
        .find(c => c.startsWith("csrf_token")) ?? ""
    const csrfToken1: string = flow1.ui?.nodes
        ?.find((n: any) => n.attributes?.name === "csrf_token")?.attributes?.value ?? ""

    // Step 2: Submit identifier — Kratos returns a 422 redirect to the challenge flow
    const step2Res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login?flow=${flow1.id}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Cookie": csrfCookieKV,
        },
        body: JSON.stringify({ method: "webauthn", csrf_token: csrfToken1, identifier: user.tgId }),
    })
    const step2Data = await step2Res.json()

    const redirectUrl = step2Data.redirect_browser_to ?? ""
    const newFlowId = new URL(redirectUrl, "http://x").searchParams.get("flow")
    if (!newFlowId) {
        console.error("[kratos/login GET] unexpected step2 response:", step2Data)
        return NextResponse.json({ error: "unexpected_login_flow" }, { status: 500 })
    }

    // Step 3: Fetch the challenge flow with the CSRF cookie
    const flow2Res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login/flows?id=${newFlowId}`, {
        headers: { "Accept": "application/json", "Cookie": csrfCookieKV },
    })
    const flow2 = await flow2Res.json()

    const csrfToken2: string = flow2.ui?.nodes
        ?.find((n: any) => n.attributes?.name === "csrf_token")?.attributes?.value ?? ""

    return NextResponse.json({ flow: flow2, csrfToken: csrfToken2, csrfCookie: csrfCookieKV })
}

export async function POST(req: NextRequest) {
    const { flowId, body, csrfToken, csrfCookie } = await req.json()

    const res = await fetch(`${KRATOS_PUBLIC_URL}/self-service/login?flow=${flowId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(csrfCookie ? { "Cookie": csrfCookie } : {}),
        },
        body: JSON.stringify({ ...body, csrf_token: csrfToken }),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json(data, { status: res.status })

    return NextResponse.json({ sessionToken: data.session_token })
}
