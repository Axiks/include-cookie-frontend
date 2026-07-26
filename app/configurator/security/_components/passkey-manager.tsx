'use client'

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button, Callout, Card, Flex, Text, TextField, Box } from "@radix-ui/themes"
import { TrashIcon, PlusIcon } from "@radix-ui/react-icons"
import { TriangleAlertIcon, KeyRoundIcon } from "lucide-react"
import type { KratosPasskey } from "../page"

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

function parseKratosCreationOptions(raw: string): CredentialCreationOptions {
    const parsed = JSON.parse(raw)
    const pk = parsed.publicKey
    return {
        publicKey: {
            ...pk,
            challenge: base64urlToBuffer(pk.challenge),
            user: { ...pk.user, id: base64urlToBuffer(pk.user.id) },
            excludeCredentials: pk.excludeCredentials?.map((c: any) => ({
                ...c,
                id: base64urlToBuffer(c.id),
            })) ?? [],
        },
    }
}

interface Props {
    passkeys: KratosPasskey[]
    hasKratosId: boolean
}

export default function PasskeyManager({ passkeys: initial, hasKratosId }: Props) {
    const t = useTranslations('configurator.security')
    const [passkeys, setPasskeys] = useState(initial)
    const [adding, setAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [displayName, setDisplayName] = useState("")

    async function handleAdd() {
        if (!displayName.trim()) return
        setAdding(true)
        setError(null)
        try {
            const res = await fetch("/api/kratos/settings")
            if (!res.ok) throw new Error()
            const { flow, token } = await res.json()

            const triggerNode = flow.ui?.nodes?.find(
                (n: any) => n.attributes?.name === "webauthn_register_trigger"
            )
            if (!triggerNode?.attributes?.value) throw new Error("no_trigger")

            const options = parseKratosCreationOptions(triggerNode.attributes.value)

            const credential = await navigator.credentials.create(options) as
                (PublicKeyCredential & { response: AuthenticatorAttestationResponse }) | null
            if (!credential) throw new Error("no_credential")

            const credJSON = {
                id: credential.id,
                rawId: bufferToBase64url(credential.rawId),
                type: credential.type,
                response: {
                    clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
                    attestationObject: bufferToBase64url(credential.response.attestationObject),
                    transports: credential.response.getTransports?.() ?? [],
                },
            }

            const submitRes = await fetch("/api/kratos/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    flowId: flow.id,
                    token,
                    body: {
                        method: "webauthn",
                        webauthn_register: JSON.stringify(credJSON),
                        webauthn_register_displayname: displayName.trim(),
                    },
                }),
            })
            if (!submitRes.ok) throw new Error("submit_failed")

            window.location.reload()
        } catch (e: any) {
            if (e?.name !== "NotAllowedError") {
                setError(t('errorAdd'))
            }
        } finally {
            setAdding(false)
        }
    }

    async function handleDelete(credentialId: string) {
        setDeletingId(credentialId)
        setError(null)
        try {
            const res = await fetch("/api/kratos/settings", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credentialId }),
            })
            if (!res.ok) throw new Error()
            setPasskeys(prev => prev.filter(p => p.id !== credentialId))
        } catch {
            setError(t('errorDelete'))
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <Flex direction="column" gap="4">
            <Box>
                <Text size="3" weight="medium">{t('passkeys')}</Text>
                <Text size="2" color="gray" as="p" mt="1">{t('passkeysDesc')}</Text>
            </Box>

            {!hasKratosId && (
                <Callout.Root color="orange">
                    <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
                    <Callout.Text>{t('errorNoKratos')}</Callout.Text>
                </Callout.Root>
            )}

            {error && (
                <Callout.Root color="red">
                    <Callout.Icon><TriangleAlertIcon size={16} /></Callout.Icon>
                    <Callout.Text>{error}</Callout.Text>
                </Callout.Root>
            )}

            {passkeys.length === 0 ? (
                <Text size="2" color="gray">{t('noPasskeys')}</Text>
            ) : (
                <Flex direction="column" gap="2">
                    {passkeys.map(pk => (
                        <Card key={pk.id}>
                            <Flex align="center" justify="between">
                                <Flex align="center" gap="2">
                                    <KeyRoundIcon size={14} />
                                    <Box>
                                        <Text size="2" weight="medium" as="p">
                                            {pk.display_name || pk.id}
                                        </Text>
                                        <Text size="1" color="gray" as="p">
                                            {t('createdAt')}: {new Date(pk.added_at).toLocaleDateString()}
                                        </Text>
                                    </Box>
                                </Flex>
                                <Button
                                    variant="soft"
                                    color="red"
                                    size="1"
                                    loading={deletingId === pk.id}
                                    disabled={!!deletingId || adding}
                                    onClick={() => handleDelete(pk.id)}
                                >
                                    <TrashIcon />
                                    {deletingId === pk.id ? t('deleting') : t('deletePasskey')}
                                </Button>
                            </Flex>
                        </Card>
                    ))}
                </Flex>
            )}

            {hasKratosId && (
                <Flex gap="2" align="end">
                    <Box flexGrow="1">
                        <Text size="2" as="label" mb="1">{t('addDisplayName')}</Text>
                        <TextField.Root
                            placeholder={t('addDisplayNamePlaceholder')}
                            value={displayName}
                            onChange={e => setDisplayName(e.target.value)}
                            disabled={adding || !!deletingId}
                            onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
                        />
                    </Box>
                    <Button
                        variant="soft"
                        loading={adding}
                        disabled={!displayName.trim() || !!deletingId}
                        onClick={handleAdd}
                    >
                        <PlusIcon />
                        {adding ? t('adding') : t('addPasskey')}
                    </Button>
                </Flex>
            )}
        </Flex>
    )
}
