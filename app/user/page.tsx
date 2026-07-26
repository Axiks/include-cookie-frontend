import { Flex, Heading, Section, Text } from "@radix-ui/themes";
import UsersSection from "./_components/users-section";
import { getTranslations } from "next-intl/server";

export default async function UserPage() {
    const t = await getTranslations('user')

    return (
        <Flex direction="column">
            <Section size="1" />
            <Flex direction="column">
                <Heading as="h1" size="8" weight="regular">
                    {t('title')}
                </Heading>
                <Text as="p" color="gray">{t('description')}</Text>
            </Flex>
            <Section size="1" />
            <UsersSection />
            <Section size="1" />
        </Flex>
    )
}