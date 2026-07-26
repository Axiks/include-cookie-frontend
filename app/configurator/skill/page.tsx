import { Box, Button, Flex, Text } from "@radix-ui/themes";
import { getCatalog } from "@/lib/catalog";
import { Group, IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface";
import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { GroupItemsDto, SkillSectionDef, SkillTagDto } from "./action";
import SkillSection from "./SkillSection";
import { getUserTags } from "@/lib/catalog/user-tags";
import { auth } from "@/auth";
import { getTranslations } from "next-intl/server";

export default async function SkillConfig() {
    var groupService: IGroupService = getCatalog().groups()

     const session = await auth()
    if(session == null) throw Error("User dont auth")

    const [userSelectedTags, progLang, groupOs, hobby, t] = await Promise.all([
        getUserTags(session.user?.kratosId),
        groupService.find("programming language"),
        groupService.find("operating system"),
        groupService.find("hobby"),
        getTranslations('configurator.skills'),
    ])

    const uiSections: SkillSectionDef[] = [
        { title: t('progLangTitle'), description: t('progLangDesc'), placeholder: t('progLangPlaceholder'), group: progLang[0] },
        { title: t('osTitle'),       description: t('osDesc'),       placeholder: t('osPlaceholder'),       group: groupOs[0] },
        { title: t('hobbyTitle'),    description: t('hobbyDesc'),    placeholder: t('hobbyPlaceholder'),    group: hobby[0] },
    ]

    // get tags from group helprt
    function map(group: Group): TagData[] {
        var devStagesTags: TagData[] = []
        const devStages = group.items
            
        devStages.forEach(x => { 
            const item = x.object
            try{
                const tag = item as Tag
                devStagesTags.push(tag.packing())
            }
            catch{}
        })

        return devStagesTags
    }

    var groupsDto: GroupItemsDto[] = []

    for(let section of uiSections) {
        const tagsData = map(section.group)

        let skillsTagDto: SkillTagDto[] = []
        for(var itm of tagsData) {
            const isUserSelected = userSelectedTags?.find(t => t.uid == itm.uid) != undefined
            let name = itm.name.find(x => x.lang=="en" && x.isPrimary == true)
            if(!name) name = itm.name.find(x => x.isPrimary == true)
            if(!name && itm.name.length > 0) name = itm.name[0]
            skillsTagDto.push({ uid: itm.uid, name: name?.body ?? "not found", isSelected: isUserSelected })
        }

        var groupItemDto: GroupItemsDto = { 
            uid: progLang[0].uid,
            title: section.title,
            description: section.description, 
            placeholder: section.placeholder, 
            items: skillsTagDto 
        }
        groupsDto.push(groupItemDto)
    }
    
    return(
        <Flex gap="5" direction="column">
            <SkillSection viewModel={ groupsDto } />
        </Flex>
    )
}