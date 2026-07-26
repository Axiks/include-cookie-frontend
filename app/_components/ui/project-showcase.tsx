import { Badge, Flex, Text } from "@radix-ui/themes"
import { LinkNeko } from "./link-neko"
import { Project } from "@/lib/shared/project/project.service.interface"
import TagsWidget from "@/app/project/_components/tag-list-widget"

export async function ProjectsShowcaseWidjet({projects}: {projects: Project[]}) {
  return(
    <Flex direction="column" gap="3">
      {projects.map(p => <ProjectLineItem key={p.id} project={p} /> )}
    </Flex>
  )
}

export async function ProjectLineItem({project}: {project: Project}) {
  return(
      <Flex direction="row" gap="1" justify="between" align="center" wrap="wrap">
        <LinkNeko href={"/project/" + project.id }><Text size="2">{project.title}</Text></LinkNeko>
        <TagsWidget tags={project.tags} />
      </Flex>
  )
}