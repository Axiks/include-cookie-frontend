import { Container, Heading, Section, Text } from "@radix-ui/themes";
import { SkillChart, SkillChartItem, TrendsWidget } from "./_components/statistic-char";
import { getCatalog } from "@/lib/catalog";
import { getTranslations } from "next-intl/server";

export default async function StatisticPage() {
    const statisticService = getCatalog().stats()
    const groupService = getCatalog().groups()
    const t = await getTranslations('statistic')

    const progLang = await groupService.find("programming language")
    if (progLang.length === 0) {
        return (
            <Container>
                <Section size="1" />
                <Heading as="h1" size="8" weight="regular">{t('title')}</Heading>
                <Section size="1" />
                <Text color="gray">{t('noData')}</Text>
            </Container>
        )
    }

    const statistic = await statisticService.genPopularityByCategory(progLang[0].uid)

    const chartData: SkillChartItem[] = statistic.items
        .filter(item => item.score > 0)
        .map(item => ({
            name: item.tag.getMainName(),
            major: item.score,
            secondary: 0,
            learning: 0,
            total: item.score,
        }))
        .sort((a, b) => b.total - a.total)

    return (
        <Container>
            <Section size="1" />
            <Heading as="h1" size="8" weight="regular">{t('title')}</Heading>
            <Text as="p" color="gray">{t('description')}</Text>
            <Section size="1" />

            <TrendsWidget data={chartData} />
            <Section size="1" />
            <SkillChart data={chartData} totalVoters={0} />
        </Container>
    )
}
