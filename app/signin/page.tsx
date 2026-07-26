'use server'

import { auth } from "@/auth"
import { Box, Container, Flex, Heading, Section, Separator, Text } from "@radix-ui/themes"
import { redirect } from "next/navigation"
import React, { Suspense } from "react"
import PasskeySignIn from "./_components/passkey-sign-in"
import TelegramWidgetButton from "./_components/telegram-widget-button"
import TelegramCallbackHandler from "./_components/telegram-callback-handler"
import DevPasskeyRegister from "./_components/dev-passkey-register"
import { getTranslations } from "next-intl/server"

export default async function Login() {
    const inDevEnvironment = process.env.NODE_ENV === 'development'
    if (!inDevEnvironment) {
        const session = await auth()
        if (session) redirect("/")
    }

    const t = await getTranslations('signin')
    const botName = process.env.BOT_NAME ?? ''

    return (
        <Container>
            <Section size="1" />
            <Heading as="h1" size="8" weight="regular">
                {t('title')}
            </Heading>
            <Section size="1" />

            <Flex direction="column" maxWidth="38em" gap="4">

                {/* Handles tg_token in URL after widget redirect — signs in client-side */}
                <Suspense>
                    <TelegramCallbackHandler />
                </Suspense>

                <Flex direction="column" gap="2" align="start">
                    <Text size="2" color="gray">{t('viaTelegramDesc')}</Text>
                    <Suspense>
                        <TelegramWidgetButton botUsername={botName} />
                    </Suspense>
                </Flex>

                <Separator size="4" />

                <PasskeySignIn />

                {inDevEnvironment && (
                    <>
                        <Separator size="4" />
                        <Suspense>
                            <DevPasskeyRegister />
                        </Suspense>
                    </>
                )}
            </Flex>
        </Container>
    )
}
