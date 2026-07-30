import { Box, Flex, Section, Text } from "@radix-ui/themes";
import { LinkNeko } from "../../ui/link-neko";
import { inDevEnvironment } from "@/lib/shared/utils/helpers";
import { getTranslations } from "next-intl/server";

export default async function Footer() {
    const t = await getTranslations('footer')

    return (
      <Box pb={{ initial: '5', sm: '0' }}>
        <Section size="1" />
        {/* Narrow screens: brand + year on top, links below. Wide: single row. */}
        <Flex
          direction={{ initial: 'column', sm: 'row' }}
          justify="between"
          align={{ initial: 'start', sm: 'center' }}
          gap={{ initial: '3', sm: '5' }}
          wrap="wrap"
          width="100%"
          py="4"
        >
          <Flex gap="3" align="center" wrap="wrap">
            <Text>© Programmers & Cookies</Text>
            <Text color="gray">·</Text>
            <Text>2026 {inDevEnvironment && <Text color="red">| dev</Text>}</Text>
          </Flex>

          <Flex gap={{ initial: '4', sm: '5' }} align="center" wrap="wrap">
            <LinkNeko href="https://t.me/include_anime" name={t('telegram')} />
            <LinkNeko href="https://github.com/Axiks/lumispace" name={t('github')} />
            <LinkNeko href="/support" name={t('support')} />
          </Flex>
        </Flex>
      </Box>
    );
}
