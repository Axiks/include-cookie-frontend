import Tag from "./Tag"
import { ProjectData } from "@/lib/shared/project/_types/ProjectData"
import { Project } from "@/lib/shared/project/project.service.interface"

export type Item = {
    uid: string
    object: ItemObjectType
    objectType: string
    tags: Tag[]
    relatedObjects: RelatedObject[]
}

export type ItemObjectType = (Tag | null) | EntityBasicType | ProjectData | Project

export type EntityBasicType = { id: string }

export type RelatedObject = {
    type: string
    object: ItemObjectType
}