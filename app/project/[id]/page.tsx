import Cover from '@/app/_components/ui/cover'
import { getCatalog } from '@/lib/catalog'
import { Box, Flex, Text } from '@radix-ui/themes'
import { Group, IGroupService } from '@/lib/shared/tag-system/group/service/group.service.interface'
import Tag from '@/lib/shared/tag-system/_types/Tag'
import ITagService from '@/lib/shared/tag-system/tag/service/tag.service.interface'
import { IProjectService } from '@/lib/shared/project/project.service.interface'
import { notFound } from 'next/navigation'
import { tagExtended } from '@/lib/shared/tag-system/_types/tag.extended'
import DevEthapWidget, { DevEthapWidgetNew } from '../_components/dev-ethap-widget'
import LinksWidjet from '../_components/links-widget'
import ContributorsWidget from '../_components/contributor-list-widget'
import TagsWidget from '../_components/tag-list-widget'
import OpenForColabWidget from '../_components/open-for-colab-widget'
import Markdown from 'react-markdown'


export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const projectService: IProjectService = getCatalog().projects()
  const groupService: IGroupService = getCatalog().groups()
  const tagService: ITagService = getCatalog().tags()

  // Don't 500 a project page if the Catalog is unreachable — treat it the same as a
  // missing project (this route is now reachable in production ahead of sign-in/edit).
  let project: Awaited<ReturnType<typeof projectService.getById>> = null
  try {
    project = await projectService.getById(id)
  } catch (e) {
    console.warn("[project/[id]] catalog unavailable:", (e as Error).message)
    notFound()
  }
  if(project == null) notFound()

  const openForColabTag = await tagService.getByName("Requires maintance")

  // Project tags come from the REST project (no separate graph read).
  const projectTags = project.tags

  const group = await groupService.find("development status")
  const devStagesTags: Tag[] = group && group.length != 0 ? await getGroupTags(group[0]) : []

  var devSrageTag: Tag = devStagesTags[0]
  for(const devStagesTag of devStagesTags) {
    const avaibleTag = projectTags.find(t => t.uid == devStagesTag.uid)
    if(avaibleTag) devSrageTag = avaibleTag
  }

  // helpers
  async function getGroupTags(group: Group): Promise<Tag[]> {
    var devStagesTags: Tag[] = []
    const devStages = group.items
  
    devStages.forEach(x => { 
      const item = x.object
      try{
        devStagesTags.push(item as Tag)
      }
      catch{}
    })

    return devStagesTags
  }

  function IsTagAvaible(projectTags: Tag[], tag: Tag): boolean {
    for(const t of projectTags) {
      if(t.uid == tag.uid) return true
    }

    return false
  }

  const isProjectOpenForColab = IsTagAvaible(projectTags, openForColabTag!)

  return (
    <Flex direction="column" gap="3">
      { project.covers.length != 0 ? <Cover src={project.covers[0].src.startsWith('http') ? project.covers[0].src : "/cdn/covers/" + project.covers[0].src} /> : null }
      
      <Flex justify="between" align="center" gap="2" wrap="wrap" py="3">
        <Flex gap="3" align="center">
          <Text size="7">{project?.title}</Text>
          <DevEthapWidgetNew ethapList={ devStagesTags.length != 0 ? devStagesTags : [] } currentEthap={devSrageTag} />
        </Flex>
      </Flex>

      <Flex direction="column" gap="3" maxWidth="800px">
        <TagsWidget tags={projectTags} />
        {/* <DevEthapWidgetNew ethapList={ devStagesTags.length != 0 ? devStagesTags.map(x => tagExtended(x).mainName) : [] } currentEthap={tagExtended(devSrageTag).mainName} /> */}
        <Box pt="3">
          <Markdown>{project?.synopsis}</Markdown>
        </Box>
        <LinksWidjet links={project.links} />

          { isProjectOpenForColab
          ? <Box py="3">
              <OpenForColabWidget matchedSkils={[]} />
            </Box>
          : null }

        <Text color="gray">Developers</Text>
        <ContributorsWidget contributors={ project.contributor } />
        
      </Flex>
    </Flex>
  )
}