'use client'

import { Button, Callout } from "@radix-ui/themes"
import { KeyRoundIcon, TriangleAlertIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { safeNext } from "@/lib/safe-next"

function bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let str = ""
    for (const b of bytes) str += String.fromCharCode(b)
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return bytes.buffer
}

export default function PasskeySignIn() {
    const t = useTranslations('signin')
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handlePasskeySignIn() {
        setError(null)
        setLoading(true)
        try {
            // 1. Get a challenge from our server (empty allowCredentials → discoverable)
            const { challengeId, options } = await fetch("/api/passkey").then(r => r.json())

            // 2. Browser shows native passkey picker
            const cred = await navigator.credentials.get({
                publicKey: {
                    ...options,
                    challenge: base64urlToBuffer(options.challenge),
                    allowCredentials: [],
                },
            }) as PublicKeyCredential
            if (!cred) throw new Error(t('errorPasskey'))

            const assertion = cred.response as AuthenticatorAssertionResponse

            // 3. Submit assertion to our verify endpoint
            const verifyRes = await fetch("/api/passkey", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challengeId,
                    assertion: {
                        id: cred.id,
                        rawId: bufferToBase64url(cred.rawId),
                        type: cred.type,
                        response: {
                            clientDataJSON: bufferToBase64url(assertion.clientDataJSON),
                            authenticatorData: bufferToBase64url(assertion.authenticatorData),
                            signature: bufferToBase64url(assertion.signature),
                            userHandle: assertion.userHandle
                                ? bufferToBase64url(assertion.userHandle)
                                : undefined,
                        },
                    },
                }),
            })

            if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}))
                if (err.error === "credential_not_found") throw new Error(t('errorPasskeyNoCredentials'))
                throw new Error(t('errorPasskey'))
            }

            const { token } = await verifyRes.json()
            if (!token) throw new Error(t('errorPasskey'))

            // 4. Exchange verify token for a NextAuth session
            const result = await signIn("passkey", { verifyToken: token, redirect: false })
            if (result?.error) throw new Error(t('errorPasskey'))
            window.location.replace(safeNext(searchParams.get("next")))
        } catch (e: any) {
            if (e?.name !== "NotAllowedError") {
                setError(e?.message ?? t('errorPasskey'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Button
                size="2"
                variant="soft"
                loading={loading}
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
