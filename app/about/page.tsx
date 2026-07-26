import { Box, Code, Em, Flex, Heading, Link, Quote, Section, Separator, Skeleton, Text } from "@radix-ui/themes";
import Image from 'next/image'
import { LinkNeko } from "../_components/ui/link-neko";
import { getTranslations } from "next-intl/server";

export default async function RulePage() {
    const t = await getTranslations('about')
    const botLink = (chunks: React.ReactNode) => (
        <Link href="https://t.me/include_cookie_bot" target="_blank">{chunks}</Link>
    )

    return (
        <>
            <Section size="1" />
            <Heading id="rule" as="h1" size="8" weight="regular">
                {t('title')}
            </Heading>
            <Section size="1" />
            <Flex direction="row" wrap="wrap" gap="3" align="center">
                <Link href="#rule">{t('nav.rules')}</Link>
                <Separator orientation="vertical" />
                <Link href="#recomendation">{t('nav.recommendations')}</Link>
                <Separator orientation="vertical" />
                <Link href="https://loli.in.ua/" target="_blank">{t('nav.metaQuestion')}</Link>
                <Separator orientation="vertical" />
                <Link href="#contact">{t('nav.contact')}</Link>
                <Separator orientation="vertical" />
                <LinkNeko href="/support" name={t('nav.support')} />
            </Flex>

            <Section size="1" />
            <Heading id="rule" as="h1" size="8" weight="regular">
                {t('rules.title')}
            </Heading>
            <Quote>{t('rules.quote')}</Quote>
            <Heading as="h2" size="6" weight="regular" mt="4">{t('rules.forbidden')}</Heading>
            <Text as="p" size="4" my="2">{t('rules.rule1')}</Text>
            <Text as="p" my="2" size="4">{t('rules.rule2')}</Text>
            <Box px="8">
                {t('rules.rule2detail')}
            </Box>
            <Text as="p" size="4" my="2">{t('rules.rule3')}</Text>
            <Box px="8">
                <Text as="p" my="2">{t('rules.rule3detail1')}</Text>
                <Text as="p" my="2">{t('rules.rule3detail2')}</Text>
            </Box>
            <Text as="p" size="4" my="2">{t('rules.rule4')}</Text>
            <Box px="8">
                <Text as="p" my="2">{t('rules.rule4detail1')}</Text>
                <Text as="p" my="2">
                    {t.rich('rules.rule4detail2', { link: botLink })}
                </Text>
            </Box>
            <Heading as="h2" size="6" weight="regular" mt="4" mb="4">{t('rules.punishmentTitle')}</Heading>
            <Text as="p" my="2">{t('rules.punishment1')}</Text>
            <Text as="p" my="2">{t('rules.punishment2')}</Text>
            <Heading as="h2" size="6" weight="regular" mt="4">{t('rules.appealTitle')}</Heading>
            <Text as="p" my="2">
                {t.rich('rules.appeal', { link: botLink })}
            </Text>

            <Section size="1" />
            <Heading id="recomendation" as="h1" size="8" weight="regular">
                {t('recommendations.title')}
            </Heading>
            <Section size="1" />
            <Heading as="h2" size="6" weight="regular" mt="4">{t('recommendations.codeTitle')}</Heading>
            <Text as="p" my="2">{t('recommendations.codeP1')}</Text>
            <Text as="p" my="2">{t('recommendations.codeOurEditor')}</Text>
            <Text as="p"><Link href="https://past.neko3.space/" target="_blank">- Neko3 Past Bin</Link></Text>
            <Text as="p" my="2">{t('recommendations.codePopular')}</Text>
            <Text as="p"><Link href="https://paste.c-net.org" target="_blank">- Paste C-Net</Link></Text>
            <Text as="p"><Link href="https://codesandbox.io/templates" target="_blank">- Codesandbox</Link></Text>
            <Text as="p"><Link href="http://codeshare.io/" target="_blank">- Codeshare</Link></Text>
            <Text as="p"><Link href="https://gist.github.com/" target="_blank">- Gist <Em>by GitHub</Em></Link></Text>
            <Text as="p"><Link href="https://pastebin.com/" target="_blank">- PasteBin</Link></Text>
            <Text as="p"><Link href="https://codepen.io/pen/" target="_blank">- CodePen</Link></Text>
            <Text as="p" my="2">
                {t.rich('recommendations.codeInline', {
                    code: (chunks) => <Code>{chunks}</Code>
                })}
            </Text>
            <Text as="p" my="2">{t('recommendations.codeExample')}</Text>
            <pre>
                <Code>
                    {"```"}<br />
                        import random<br />
                        import os<br />
                        <br />
                        if random.randint(0, 6) == 1:<br />
                        {"   "}os.remove({'"'}C:\Windows\System32{'"'})<br />
                    {"```"}<br />
                </Code>
            </pre>
            <Text as="p" my="2">{t('recommendations.codeResult')}</Text>
            <Skeleton>
                <Image
                    alt="Message result"
                    src="/tg-code-message-result-example.png"
                    sizes="100vw"
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        height: 'auto',
                        borderRadius: 'var(--radius-4)'
                    }}
                    width={0}
                    height={0}
                />
            </Skeleton>
            <Heading id="meta-question" as="h2" size="6" weight="regular" mt="4">{t('recommendations.metaTitle')}</Heading>
            <Text as="p" my="2">{t('recommendations.metaP1')}</Text>
            <Text as="p"><Link href="https://loli.in.ua/" target="_blank"> {">"} {t('nav.metaQuestion')} {"<"} </Link></Text>

            <Section size="1" />
            <Heading id="contact" as="h1" size="8" weight="regular">
                {t('contact.title')}
            </Heading>
            <Section size="1" />
            <Text as="p" mt="2">
                {t.rich('contact.p1', {
                    link: (chunks) => (
                        <Link href="https://t.me/include_cookie_bot" target="_blank">{chunks}</Link>
                    )
                })}
            </Text>
            <Text as="p" my="2">{t('contact.or')}</Text>
            {"->"}  <Link href="mailto:nyaa@neko3.space">nyaa@neko3.space</Link> {"<-"}
        </>
    );
}
