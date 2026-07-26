'use server'

import { Container, Heading, Section, Text, Flex, Grid, Select } from "@radix-ui/themes";
import { findScopedProjects } from "@/lib/catalog/community-projects";
import ProjectsIndex from "./projects-index";
import { Sort } from "@/lib/shared/_enums/sort-enum";
import SortDirectionComponent from "@/app/_components/ui/sort-direction-component";
import { getTranslations } from "next-intl/server";

export default async function ProjectsSection(
    {
        sort,
    }: {
        sort: Sort
    }) {
    const t = await getTranslations('project')

    // Don't 500 the /project page if the Catalog is unreachable — show a friendly
    // "unavailable" message instead (mirrors the home page's degrade-gracefully pattern).
    let projects
    try {
        projects = await findScopedProjects(undefined, sort)
    } catch (e) {
        console.warn("[project] catalog unavailable:", (e as Error).message)
        return (
            <Container>
                <Text color="gray">{t('unavailable')}</Text>
            </Container>
        )
    }

    return (
        <Container>
            <Flex gap="3" align="center" justify="end">
                <Text>{t('orderBy')}</Text>
                <SortDirectionComponent defaultValue={sort} />
            </Flex>
            <ProjectsIndex projects={projects} />
        </Container>
    )
}