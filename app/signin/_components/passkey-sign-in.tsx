'use client'

import { Button, Callout, TextField } from "@radix-ui/themes"
import { KeyRoundIcon, TriangleAlertIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { safeNext } from "@/lib/safe-next"

function base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let str = ""
    for (const b of bytes) str += String.fromCharCode(b)
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

interface KratosFlowNode {
    group?: string
    attributes?: { name?: string; value?: string; onclick?: string }
    messages?: unknown[]
}

interface KratosFlow {
    id: string
    ui?: { nodes?: KratosFlowNode[] }
}

interface PublicKeyCredentialRequestOptionsJSON {
    challenge: string
    allowCredentials?: Array<{ id: string; type: string; transports?: string[] }>
    timeout?: number
    rpId?: string
    userVerification?: UserVerificationRequirement
}

export default function PasskeySignIn() {
    const t = useTranslations('signin')
    const searchParams = useSearchParams()
    const [nickname, setNickname] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handlePasskeySignIn() {
        if (!nickname.trim()) return
        setError(null)
        setLoading(true)
        try {
            // Step 1: verify the nickname exists in Kratos, get its Telegram id (the
            // WebAuthn identifier) + the public Kratos origin.
            const infoRes = await fetch(`/api/passkey?nickname=${encodeURIComponent(nickname.trim())}`)
            if (!infoRes.ok) {
                if (infoRes.status === 404) throw new Error(t('errorPasskeyNotFound'))
                throw new Error(t('errorPasskey'))
            }
            const { tgId, kratosPublicUrl } = await infoRes.json() as { tgId: string; kratosPublicUrl: string }

            // Step 2: initiate the Kratos browser login flow (the API flow omits WebAuthn nodes).
            const flowRes = await fetch(`${kratosPublicUrl}/self-service/login/browser`, {
                headers: { Accept: "application/json" },
                credentials: "include",
            })
            const flowBody = await flowRes.json()

            // Already-valid Kratos session on this browser — skip straight to whoami.
            if (!flowRes.ok && (flowBody as { error?: { id?: string } }).error?.id === "session_already_available") {
                const kratosId = await finishViaWhoami(kratosPublicUrl)
                await exchangeAndSignIn(kratosId, searchParams.get("next"))
                return
            }

            if (!flowRes.ok) throw new Error(t('errorPasskey'))
            const flow = flowBody as KratosFlow
            const flowId: string = flow.id
            const csrfToken: string = flow.ui?.nodes
                ?.find(n => n.attributes?.name === "csrf_token")
                ?.attributes?.value ?? ""

            // Step 3: submit identifier + method=webauthn to trigger the WebAuthn challenge.
            const challengeRes = await fetch(`${kratosPublicUrl}/self-service/login?flow=${flowId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "include",
                body: JSON.stringify({ method: "webauthn", identifier: tgId, csrf_token: csrfToken }),
            })

            let challengeFlow = await challengeRes.json() as KratosFlow

            // Kratos may return 422 with redirect_browser_to pointing at a new flow.
            if (challengeRes.status === 422) {
                const redirect = (challengeFlow as unknown as { redirect_browser_to?: string }).redirect_browser_to
                if (redirect) {
                    const newFlowId = new URL(redirect).searchParams.get("flow")
                    if (newFlowId) {
                        const retryRes = await fetch(`${kratosPublicUrl}/self-service/login/flows?id=${newFlowId}`, {
                            headers: { Accept: "application/json" },
                            credentials: "include",
                        })
                        if (!retryRes.ok) throw new Error(t('errorPasskey'))
                        challengeFlow = await retryRes.json() as KratosFlow
                    }
                }
            }

            const assertFlowId = challengeFlow.id ?? flowId
            const assertCsrfToken = challengeFlow.ui?.nodes
                ?.find(n => n.attributes?.name === "csrf_token")
                ?.attributes?.value ?? csrfToken

            // Step 4: extract the webauthn_login_trigger node.
            const webAuthnNode = challengeFlow.ui?.nodes?.find(
                n => n.group === "webauthn" && n.attributes?.name === "webauthn_login_trigger",
            )
            if (!webAuthnNode) throw new Error(t('errorPasskeyNoCredentials'))

            const onclickStr: string = webAuthnNode.attributes?.onclick ?? ""
            const nodeValue: string = webAuthnNode.attributes?.value ?? ""

            // Kratos embeds options in onclick as window.oryWebAuthnLogin({...}) (v1.3+),
            // falling back to the value attribute which also carries the options JSON.
            const optionsMatch =
                onclickStr.match(/oryWebAuthnLogin\((\{[\s\S]+\})\)/) ??
                (nodeValue ? [null, nodeValue] : null)
            if (!optionsMatch) throw new Error(t('errorPasskey'))
            const parsed = JSON.parse(optionsMatch[1]) as { publicKey?: PublicKeyCredentialRequestOptionsJSON } | PublicKeyCredentialRequestOptionsJSON
            const publicKeyOptions = (parsed as { publicKey?: PublicKeyCredentialRequestOptionsJSON }).publicKey ?? parsed as PublicKeyCredentialRequestOptionsJSON

            // Step 5: browser performs the WebAuthn assertion.
            const credential = await navigator.credentials.get({
                publicKey: {
                    ...publicKeyOptions,
                    challenge: base64urlToBuffer(publicKeyOptions.challenge as unknown as string),
                    allowCredentials: (publicKeyOptions.allowCredentials ?? []).map(c => ({
                        id: base64urlToBuffer(c.id as unknown as string),
                        type: c.type as PublicKeyCredentialType,
                        transports: c.transports as AuthenticatorTransport[] | undefined,
                    })),
                },
            }) as PublicKeyCredential | null
            if (!credential) throw new Error(t('errorPasskey'))

            const assertionResponse = credential.response as AuthenticatorAssertionResponse
            const webauthnLogin = JSON.stringify({
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
                    clientDataJSON: bufferToBase64url(assertionResponse.clientDataJSON),
                    signature: bufferToBase64url(assertionResponse.signature),
                    userHandle: assertionResponse.userHandle
                        ? bufferToBase64url(assertionResponse.userHandle)
                        : null,
                },
            })

            const identifierValue = challengeFlow.ui?.nodes
                ?.find(n => n.attributes?.name === "identifier")
                ?.attributes?.value ?? tgId

            // Step 6: submit the assertion to Kratos (sets the session cookie on success).
            const assertRes = await fetch(`${kratosPublicUrl}/self-service/login?flow=${assertFlowId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    method: "webauthn",
                    csrf_token: assertCsrfToken,
                    identifier: identifierValue,
                    webauthn_login: webauthnLogin,
                }),
            })

            // 422 = success for the browser flow: Kratos set a session cookie and wants to
            // redirect — we ignore the redirect and use whoami instead.
            if (!assertRes.ok && assertRes.status !== 422) throw new Error(t('errorPasskey'))

            // Step 7 + 8: kratosId from whoami, exchange for a NextAuth verifyToken, sign in.
            const kratosId = await finishViaWhoami(kratosPublicUrl)
            await exchangeAndSignIn(kratosId, searchParams.get("next"))
        } catch (e: any) {
            if (e?.name !== "NotAllowedError") {
                setError(e?.message ?? t('errorPasskey'))
            }
        } finally {
            setLoading(false)
        }
    }

    async function finishViaWhoami(kratosPublicUrl: string): Promise<string> {
        const whoamiRes = await fetch(`${kratosPublicUrl}/sessions/whoami`, { credentials: "include" })
        if (!whoamiRes.ok) throw new Error(t('errorPasskey'))
        const whoami = await whoamiRes.json() as { identity?: { id?: string } }
        const kratosId = whoami.identity?.id
        if (!kratosId) throw new Error(t('errorPasskey'))
        return kratosId
    }

    async function exchangeAndSignIn(kratosId: string, next: string | null) {
        const verifyRes = await fetch("/api/passkey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kratosId }),
        })
        if (!verifyRes.ok) throw new Error(t('errorPasskey'))
        const { verifyToken } = await verifyRes.json() as { verifyToken: string }

        const result = await signIn("passkey", { verifyToken, redirect: false })
        if (result?.error) throw new Error(t('errorPasskey'))
        window.location.replace(safeNext(next))
    }

    return (
        <div>
            <TextField.Root
                placeholder={t('passKeyNicknamePlaceholder')}
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handlePasskeySignIn()}
                size="2"
                mb="2"
            />
            <Button
                size="2"
                variant="soft"
                loading={loading}
                disabled={!nickname.trim()}
                onClick={handlePasskeySignIn}
            >
                <KeyRoundIcon size={16} />
                {t('viaPasskey')}
            </Button>
            {error && (
                <Callout.Root color="red" mt="2">
                    <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            )}
        </div>
    )
}
