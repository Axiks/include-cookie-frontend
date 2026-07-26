import { getCatalog } from "@/lib/catalog";
import ProjectConfigSection, { GroupTransferDto, ProjectDTO, ProjectTransferDto } from "../ProjectConfigSegment";
import { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface";
import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";

export default async function ProjectCreateConfig() {
    const groupService: IGroupService = getCatalog().groups()
    // temp
    const group = await groupService.find("development status")
    var devStagesTags: TagData[] = []
        if(group && group.length != 0){
        const devStages = group[0].items
        
        devStages.forEach(x => { 
            const item = x.object
            try{
                const tag = item as Tag
                devStagesTags.push(tag.packing())
            }
            catch{}
        })
    }

    const developmentStatusGroupTransferDto: GroupTransferDto = {
            tags: devStagesTags,
            selectedTag: null
        }
    
        const trensferData: ProjectTransferDto = {
            developmentStatus: developmentStatusGroupTransferDto
        }
    

    const projectDTO: ProjectDTO = {
        title: "",
        description: "",
        links: [],
        cover_url: null,
        tags: [],
        // devStatus: new Tag("", [], null).packing(),
        //devStatus: { uid:"", name: [], description: [] },
        // tags: [ { uid: "", name: "platform", description: "" }, { uid: "", name: "space", description: "" } ],
        members: [
            // { user: testUser, tags: [ { uid:"", name: "owner", description: "" }, { uid:"", name: "software developer", description: "" } ], isCanDelete: false, isCanEdit: true  },
            // { user: testUser2, tags: [ { uid:"", name: "designer", description: "" } ], isCanDelete: true, isCanEdit: true  },
        ],
        // isOpenForNewMembers: true,
        // devStagesTags: devStagesTags,
        transferData: trensferData
        // devStagesTags: []
    }

    return(
        <ProjectConfigSection viewModel={projectDTO} />
    )
}