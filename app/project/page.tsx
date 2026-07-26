'use server'

import { Box, Button, Flex, Heading, Section, Text } from "@radix-ui/themes";
import ProjectsSection from "./_components/projects-section";
import { LinkNeko } from "../_components/ui/link-neko";
import { PlusIcon } from "@radix-ui/react-icons";
import { Sort } from "@/lib/shared/_enums/sort-enum";
import { getTranslations } from "next-intl/server";
import { dynamicFeaturesEnabled } from "@/lib/features";

export default async function ProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>
}) {
  const { sort } = await searchParams
  const t = await getTranslations('project')

  var sortDirection = Sort.NEWEST
  if (sort != undefined && sort == Sort.OLDEST.toString()) {
    sortDirection = Sort.OLDEST
  }

  return (
    <>
      <Section size="1" />
      <Flex justify="between" align="center">
        <Heading as="h1" size="8" weight="regular">
          {t('title')}
        </Heading>
        {/* Adding a project needs the Configurator (sign-in), still behind dynamicFeatures. */}
        {dynamicFeaturesEnabled() && (
          <LinkNeko href="/configurator/project/create">
            <Button type="button">{t('addProject')} <PlusIcon /></Button>
          </LinkNeko>
        )}
      </Flex>
      <Text as="p" color="gray">{t('description')}</Text>
      <Section size="1" />
      <Box maxWidth="800px">
        <ProjectsSection sort={sortDirection} />
      </Box>
    </>
  )
}