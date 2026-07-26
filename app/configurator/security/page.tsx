import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { kratosAdmin } from "@/lib/kratos"
import { getTranslations } from "next-intl/server"
import { Container, Heading, Section, Text } from "@radix-ui/themes"
import PasskeyManager from "./_components/passkey-manager"

export type KratosPasskey = {
    id: string
    display_name: string
    added_at: string
}

export default async function SecurityPage() {
    const session = await auth()
    if (!session) redirect("/")

    const kratosId = session.user?.kratosId
    const t = await getTranslations('configurator.security')

    let passkeys: KratosPasskey[] = []

    if (kratosId) {
        try {
            const { data: identity } = await kratosAdmin.getIdentity({
                id: kratosId,
                includeCredential: ["webauthn"],
            })
            const config = identity.credentials?.webauthn?.config as { credentials?: KratosPasskey[] } | undefined
            passkeys = config?.credentials ?? []
        } catch {
            // якщо Kratos недоступний — показуємо порожній список
        }
    }

    return (
        <Container>
            <Section size="1" />
            <Heading as="h1" size="6" weight="regular">{t('title')}</Heading>
            <Section size="1" />
            <PasskeyManager
                passkeys={passkeys}
                hasKratosId={!!kratosId}
            />
        </Container>
    )
}
