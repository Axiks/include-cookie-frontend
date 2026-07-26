import { getCatalog } from "@/lib/catalog";
import ProjectConfigSection, { GroupTransferDto, ProjectDTO, ProjectTransferDto } from "../ProjectConfigSegment";
import { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface";
import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { IProjectService } from "@/lib/shared/project/project.service.interface";
import { notFound } from "next/navigation";
import { Text } from "@radix-ui/themes";
import { ProjectMemberDTO } from "@/app/configurator/project/_types/ProjectMember";
import { UserDto } from "@/features/user/UserDto";
import { FilterGroupsFromTagsHelper, GetGroupsTags, SelectTagsThatBelongToGroup } from "@/features/_helpers/TagScreenerHelper";

export default async function ProjectEditConfig({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const groupService: IGroupService = getCatalog().groups()
    const projectService: IProjectService = getCatalog().projects()

    const project = await projectService.getById(id)
    if(project == null) notFound()

    
    // temp
    const developmentStatus = await groupService.find("development status")
    var devStagesTags: TagData[] = GetGroupsTags(developmentStatus).map(x => x.packing())

    const preparedTagsForDisplay = FilterGroupsFromTagsHelper(developmentStatus, project.tags)
    const tags: TagData[] = preparedTagsForDisplay.map(t => t.packing())


    var devStatus: TagData | null =  getSharedTags(devStagesTags, project.tags) // init
    function getSharedTags(groupTags: TagData[], allTags: TagData[]): TagData | null {
        for(var tag of groupTags) {
            if(allTags.find(x => x.uid == tag.uid)) return tag 
        }

        return null
    }

    console.log("Project")
    console.log(project)

    var members: ProjectMemberDTO[] = []
    for(var contr of project.contributor) {
        const user: UserDto = {
            id: contr.userId,
            nickname: contr.nickname,
            image: contr.avatar?.src ?? null
        }
        const newMember: ProjectMemberDTO = {
            user: user,
            tags: []
        }
        members.push(newMember)
    }

    const developmentStatusGroupTransferDto: GroupTransferDto = {
        tags: devStagesTags,
        selectedTag: devStatus
    }

    const trensferData: ProjectTransferDto = {
        developmentStatus: developmentStatusGroupTransferDto
    }

    const projectDTO: ProjectDTO = {
        id: project.id,
        title: project.title,
        description: project.synopsis ?? "",
        cover_url: project.covers.length > 0 ? (project.covers[0].src.startsWith('http') ? project.covers[0].src : "/cdn/covers/" + project.covers[0].src) : "",
        links: project.links,
        members: members,

        tags: tags,
        transferData: trensferData

        //devStatus: devStatus,
        // isOpenForNewMembers: true,
        //devStagesTags: devStagesTags
    }

    return(
        <ProjectConfigSection viewModel={projectDTO} />
    )
}