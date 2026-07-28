'use server'

import { auth } from "@/auth"
import { Group } from "@/lib/shared/tag-system/group/service/group.service.interface"
import { setUserTags } from "@/lib/catalog/user-tags"
import { FormState } from "@/lib/utils/form-utils"
import { ReturnSkillDto } from "./SkillSection"

export const saveSkills = async (
  formState: FormState,
  formData: FormData
) => {
    const session = await auth()
    const sub = session?.user?.kratosId
    if (!sub) throw new Error("No kratos identity for user")

    const itemsIdJsonData = formData.get("stacks")?.toString()
    let selectedSkils: ReturnSkillDto[] | null = null
    if(itemsIdJsonData != undefined) selectedSkils = JSON.parse(itemsIdJsonData)
    if(selectedSkils == null) throw Error("Some error ;(")

    // Replace the user's skill set in the Catalog (it owns the graph and diffs server-side).
    const tagUids = [...new Set(selectedSkils.flatMap(s => s.tagIds))]
    await setUserTags(sub, tagUids)

    return {
        status: 'SUCCESS' as const,
        message: null,
        fieldErrors: {},
    }
}

export type SkillTagDto =
{
    uid: string,
    name: string,
    isSelected: boolean
}

export type GroupItemsDto =
{
    uid: string,
    title: string,
    description: string,
    placeholder: string,
    items: SkillTagDto[]
}

export type SkillSectionDef = {
    title: string,
    description: string,
    placeholder: string,
    group: Group
}
