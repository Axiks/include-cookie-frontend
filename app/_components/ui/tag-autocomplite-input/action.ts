"use server"

import { TagData } from "@/lib/shared/tag-system/_types/Tag"
import { getCatalog } from "@/lib/catalog"

const tagService = getCatalog().tags()

export default async function tagFindAction(name: string): Promise<TagData[]> {
    var result: TagData[] = []
    const tags =  await tagService.find(name)
    console.log("tagFindAction")
    console.log(name)
    console.log(tags)

    for(var tag of tags) {
        result.push(tag.packing())
    }

    return result
}