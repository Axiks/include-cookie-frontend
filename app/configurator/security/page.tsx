import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { authClient, type KratosPasskey } from "@/lib/auth-client"
import { getTranslations } from "next-intl/server"
import { Container, Heading, Section, Text } from "@radix-ui/themes"
import PasskeyManager from "./_components/passkey-manager"

export type { KratosPasskey }

export default async function SecurityPage() {
    const session = await auth()
    if (!session) redirect("/")

    const kratosId = session.user?.kratosId
    const t = await getTranslations('configurator.security')

    let passkeys: KratosPasskey[] = []

    if (kratosId) {
        try {
            passkeys = await authClient.listPasskeys(kratosId)
        } catch {
            // якщо auth-сервіс недоступний — показуємо порожній список
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
