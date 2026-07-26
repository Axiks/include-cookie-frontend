import ProjectCard from "@/app/project/_components/project-card";
import { Flex, Heading } from "@radix-ui/themes";
import { GetCurrentUserProjects } from "./config";
import { getTranslations } from "next-intl/server";

export default async function ProjectConfigIndex() {
    const [allUserProjects, t] = await Promise.all([
        GetCurrentUserProjects(),
        getTranslations('configurator.project'),
    ])

    return(
        <>
            <Heading>{t('indexTitle')}</Heading>
            <Flex gap="1" width="auto" direction="column" pr="7">
                { allUserProjects.map((project) => (
                    <ProjectCard key={project.id} title={project.title ?? ""} description={project.synopsis ?? ""} author={project.contributor.length != 0 ? project.contributor[0] : null} link={"project/" + project.id} tags={project.tags} />
                )) }
            </Flex>
        </>
    )
}