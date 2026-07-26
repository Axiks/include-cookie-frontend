import { Heading, Link, Section, Skeleton, Text } from "@radix-ui/themes";
import Image from 'next/image'
import { getTranslations } from "next-intl/server";
import { ShareButtons } from "./_components/share-buttons";

export default async function SupportPage() {
    const t = await getTranslations('support')

    return (
        <>
            <Section size="1" />
            <Heading as="h1" size="8" weight="regular">
                {t('title')}
            </Heading>
            <Section size="1" />
            <Text as="p" my="2">{t('p1')}</Text>
            <Text as="p" my="2">{t('p2')}</Text>
            <Text as="p" my="2">
                {t.rich('p3', {
                    link: (chunks) => (
                        <Link href="https://t.me/include_cookie_bot" target="_blank">{chunks}</Link>
                    )
                })}
            </Text>

            <Heading as="h2" size="5" weight="regular" mt="4" mb="2">
                {t('shareTitle')}
            </Heading>
            <ShareButtons />

            <Section size="1" />
            <Skeleton>
                <Image
                    alt="Arigato"
                    src="https://i.imgur.com/9nd2qnP.gif"
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
        </>
    )
}