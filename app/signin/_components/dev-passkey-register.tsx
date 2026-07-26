'use client'

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Badge, Button, Callout, Flex, Text, TextField } from "@radix-ui/themes"
import { KeyRoundIcon, TriangleAlertIcon } from "lucide-react"
import { useSearchParams } from "next/navigation"
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

export default function DevPasskeyRegister() {
    const searchParams = useSearchParams()
    const [nickname, setNickname] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleRegister() {
        const trimmed = nickname.trim()
        if (!trimmed) return
        setError(null)
        setLoading(true)
        try {
            // 1. Get registration challenge from server
            const res = await fetch(`/api/dev/passkey-register?nickname=${encodeURIComponent(trimmed)}`)
            if (!res.ok) throw new Error("Failed to get challenge")
            const { challengeId, options } = await res.json()

            // 2. Browser creates a new passkey credential
            const cred = await navigator.credentials.create({
                publicKey: {
                    ...options,
                    challenge: base64urlToBuffer(options.challenge),
                    user: {
                        ...options.user,
                        id: base64urlToBuffer(options.user.id),
                    },
                    excludeCredentials: [],
                },
            }) as PublicKeyCredential
            if (!cred) throw new Error("Passkey creation cancelled")

            const attestation = cred.response as AuthenticatorAttestationResponse

            // 3. Send registration response to server for verification
            const verifyRes = await fetch("/api/dev/passkey-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    challengeId,
                    nickname: trimmed,
                    registration: {
                        id: cred.id,
                        rawId: bufferToBase64url(cred.rawId),
                        type: cred.type,
                        response: {
                            clientDataJSON: bufferToBase64url(attestation.clientDataJSON),
                            attestationObject: bufferToBase64url(attestation.attestationObject),
                            transports: (attestation as any).getTransports?.() ?? [],
                        },
                    },
                }),
            })

            if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}))
                throw new Error(err.error ?? "Registration failed")
            }

            const { token } = await verifyRes.json()
            if (!token) throw new Error("No session token returned")

            // 4. Exchange the token for a NextAuth session
            const result = await signIn("passkey", { verifyToken: token, redirect: false })
            if (result?.error) throw new Error("Sign-in after registration failed")

            window.location.replace(safeNext(searchParams.get("next")))
        } catch (e: any) {
            if (e?.name !== "NotAllowedError") {
                setError(e?.message ?? "Registration failed")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Flex direction="column" gap="2" align="start">
            <Flex align="center" gap="2">
                <Badge color="orange" radius="full">DEV ONLY</Badge>
                <Text size="2" color="gray">Create a local account with Passkey</Text>
            </Flex>
            <Flex gap="2" align="center" wrap="wrap">
                <TextField.Root
                    placeholder="Nickname"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleRegister() }}
                    disabled={loading}
                />
                <Button
                    size="2"
                    variant="soft"
                    color="orange"
                    loading={loading}
                    disabled={!nickname.trim()}
                    onClick={handleRegister}
                >
                    <KeyRoundIcon size={16} />
                    Register &amp; sign in
                </Button>
            </Flex>
            {error && (
                <Callout.Root color="red">
                    <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            )}
        </Flex>
    )
}
