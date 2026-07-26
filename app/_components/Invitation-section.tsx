import { Box, Button, Card, Flex, Link, Text } from "@radix-ui/themes";
import Logo from "./ui/Logo/logo";
import { getTranslations } from "next-intl/server";

export default async function InvitationBox() {
    const t = await getTranslations('home')

    return (
        <Card id="invitation-card" variant="surface">
            <Flex justify="center" align="center" gap="3" wrap="wrap">
                <Logo />
                <Flex direction="column">
                    <Box as="span">
                        <Text as="p" size="3">{t('invitation.greeting')}</Text>
                        {t('invitation.welcome')}
                        <Text as="p" mt="2" size="2" color="gray">{t('invitation.joinHint')}</Text>
                    </Box>
                    <Flex as="span" mt="4" gap="2" wrap="wrap">
                        <Link href="https://t.me/include_anime" target="_blank"><Button variant="solid">Telegram</Button></Link>
                        <Link href="https://discord.gg/6Q6C6gBc" target="_blank"><Button variant="soft">Discord</Button></Link>
                        <Link href="xmpp:include_cookie@conference.talks.in.ua?join" target="_blank"><Button variant="soft">XMPP</Button></Link>
                        <Link href="https://matrix.to/#/%23include_anime:matrix.org" target="_blank"><Button variant="soft">Matrix</Button></Link>
                        <Link href="https://signal.group/#CjQKIB-3gWEBjvQDHbT6dKECgr4EXZci9xTHXp9HxcfTew0pEhATdWJbaRsIG0W0QUMLPm-L" target="_blank"><Button variant="soft">Signal</Button></Link>
                    </Flex>
                </Flex>
            </Flex>
        </Card>
    )
}