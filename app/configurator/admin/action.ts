'use server'

import Tag from "@/lib/shared/tag-system/_types/Tag"
import { Group } from "@/lib/shared/tag-system/group/service/group.service.interface"
import { getCatalog } from "@/lib/catalog"
import ITagService, { WriteTag } from "@/lib/shared/tag-system/tag/service/tag.service.interface"
import { FormState } from "@/lib/utils/form-utils"

export const saveAdminConfigFormNew = async (formState: FormState, formData: FormData) => {
  const tagService: ITagService = getCatalog().tags()

  const tagsString = formData.get("tags")?.toString()
  if(tagsString){
    const tags: Tag[] = JSON.parse(tagsString)
    tags.map(async(tag: Tag) => {
      const writeTag: WriteTag = tag
      await tagService.add(writeTag)
    })
  }

  return {
    status: 'SUCCESS' as const,
    message: null,
    fieldErrors: {},
  }
}

export interface AdminFormDTO {
    tags: Tag[]
    //categories: Category[]
    groups: Group[]
}