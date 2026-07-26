import { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface";
import AdminConfigSection from "./AdminConfigSegment";
import ITagService from "@/lib/shared/tag-system/tag/service/tag.service.interface";
import { getCatalog } from "@/lib/catalog";
import { AdminFormDTO } from "./action";

export default async function AdminConfig() {
    const groupService: IGroupService = getCatalog().groups()
    const tagService: ITagService = getCatalog().tags()

    const groups = await groupService.find()
    const tags = await tagService.find()

    const viewModel: AdminFormDTO = { 
        groups: groups,
        tags: tags
    }

    return(<AdminConfigSection viewModel={viewModel} />)
}