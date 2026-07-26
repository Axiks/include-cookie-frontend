import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { Group } from "@/lib/shared/tag-system/group/service/group.service.interface";

export function FilterGroupsFromTagsHelper(groups: Group[], tags: Tag[]): Tag[] {
    let result: Tag[] = []
    const allGroupsTags = GetGroupsTags(groups)

    for(const tag of tags) {
        const asTagExistInGroup = allGroupsTags.find(x => x.uid == tag.uid)
        if(asTagExistInGroup != undefined) continue
        result.push(tag)
    }

    return result
}

export function SelectTagsThatBelongToGroup(tags: Tag[], groups: Group[]): Tag[] {
    let result: Tag[] = []
    const allGroupsTags = GetGroupsTags(groups)

    for(const tag of tags) {
        const asTagBelongToGroup = allGroupsTags.find(x => x.uid == tag.uid)
        if(asTagBelongToGroup != undefined) result.push(tag)
    }

    return result
}

export function GetGroupsTags(groups: Group[]): Tag[] {
    let allGroupsTag: Tag[] = []
    for(const group of groups) {
        for(const item of group.items) {
            const groupTag = item.object as Tag
            allGroupsTag.push(groupTag)
        }
    }
    return allGroupsTag
}