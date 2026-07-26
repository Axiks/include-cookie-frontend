"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Flex, Text } from "@radix-ui/themes"
import { useTranslations } from "next-intl"

export type SkillChartItem = {
  name: string
  major: number
  secondary: number
  learning: number
  total: number
}

const MEDALS = ["🥇", "🥈", "🥉"]

function SegmentLabel({ x, y, width, height, value }: {
  x?: number; y?: number; width?: number; height?: number; value?: number
}) {
  if (!value || value === 0 || (width ?? 0) < 22) return null
  return (
    <text
      x={(x ?? 0) + (width ?? 0) / 2}
      y={(y ?? 0) + (height ?? 0) / 2}
      dy={4}
      textAnchor="middle"
      fill="white"
      fontSize={11}
      fontWeight={600}
    >
      {value}
    </text>
  )
}

export function TrendsWidget({ data }: { data: SkillChartItem[] }) {
  const t = useTranslations('statistic.chart')
  const top = data.slice(0, 3)
  if (top.length === 0) return null

  return (
    <Flex gap="3" wrap="wrap">
      {top.map((item, i) => (
        <Card key={item.name} className="flex-1 min-w-[130px] border shadow-none">
          <CardContent className="pt-4 pb-3 px-4">
            <Text size="5">{MEDALS[i]}</Text>
            <Text as="p" weight="bold" size="3" mt="1">{item.name}</Text>
            <Text as="p" size="1" color="gray">{t('votersCount', { count: item.total })}</Text>
          </CardContent>
        </Card>
      ))}
    </Flex>
  )
}

export function SkillChart({
  data,
  totalVoters,
}: {
  data: SkillChartItem[]
  totalVoters: number
}) {
  const t = useTranslations('statistic.chart')

  const chartConfig = {
    major:     { label: t('majorLabel'),     color: "var(--chart-1)" },
    secondary: { label: t('secondaryLabel'), color: "var(--chart-2)" },
    learning:  { label: t('learningLabel'),  color: "var(--chart-3)" },
  } satisfies ChartConfig

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-none">
        <CardContent className="pt-6">
          <Text color="gray">{t('noData')}</Text>
        </CardContent>
      </Card>
    )
  }

  const chartHeight = data.length * 48 + 20
  const maxTotal = Math.max(...data.map(d => d.total), 1)
  const hasLevels = data.some(d => d.secondary > 0 || d.learning > 0)

  return (
    <Card className="border-0 shadow-none px-0" style={{ maxWidth: 640 }}>
      <CardHeader className="pb-2 px-0">
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
          {totalVoters > 0 && ` ${t('voters', { count: totalVoters })}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {hasLevels && (
          <Flex gap="4" mb="3" wrap="wrap">
            <Flex align="center" gap="1">
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--chart-1)", display: "inline-block" }} />
              <Text size="1" color="gray">{t('majorLegend')}</Text>
            </Flex>
            <Flex align="center" gap="1">
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--chart-2)", display: "inline-block" }} />
              <Text size="1" color="gray">{t('secondaryLegend')}</Text>
            </Flex>
            <Flex align="center" gap="1">
              <span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--chart-3)", display: "inline-block" }} />
              <Text size="1" color="gray">{t('learningLegend')}</Text>
            </Flex>
          </Flex>
        )}

        <ChartContainer
          config={chartConfig}
          style={{ height: `${chartHeight}px`, width: "100%" }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 32, top: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.4} />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, maxTotal]}
              tickCount={Math.min(maxTotal + 1, 6)}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={120}
              tick={{ fontSize: 12 }}
              tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 15) + "…" : v}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelKey="name"
                  indicator="dot"
                />
              }
            />
            <Bar dataKey="major"     stackId="a" fill="var(--color-major)"     radius={[3, 0, 0, 3]} barSize={22}>
              <LabelList dataKey="major"     content={<SegmentLabel />} />
            </Bar>
            <Bar dataKey="secondary" stackId="a" fill="var(--color-secondary)" radius={0}            barSize={22}>
              <LabelList dataKey="secondary" content={<SegmentLabel />} />
            </Bar>
            <Bar dataKey="learning"  stackId="a" fill="var(--color-learning)"  radius={[0, 3, 3, 0]} barSize={22}>
              <LabelList dataKey="learning"  content={<SegmentLabel />} />
            </Bar>
          </BarChart>
        </ChartContainer>

        {hasLevels && (
          <Text as="p" size="1" color="gray" mt="3">
            {t('footnote')}
          </Text>
        )}
      </CardContent>
    </Card>
  )
}
