import Tag from "../tag-system/_types/Tag"
import Image from "../cdn/_types/Image";
import ITagExtension from "../_shared/link.service.extension.interface";
import { ICoverExtension } from "../_shared/cover.service.extension.interface";
import { Link } from "@/lib/shared";
import { Sort } from "../_enums/sort-enum";

export interface IProjectService extends ICoverExtension, ITagExtension {
    add(writeProject: WriteProject): Promise<Project>
    edit(id: string, editProject: EditProject): Promise<Project>
    delete(id: string): Promise<void>

    getById(id: string): Promise<Project | null>
    find(q?: string, sort?: Sort): Promise<Project[]>
    countAll(): Promise<number>
    getLastProjects(count?: number): Promise<Project[]>

    addHrefLink(id: string, link: Link): Promise<void>
    removeHrefLink(id: string, linkId: string): Promise<void>

    addContributor(projectId: string, сontributor: Contributor): Promise<void>
    updateContributor(projectId: string, сontributor: Contributor): Promise<void>
    removeContributor(projectId: string, сontributorId: string): Promise<void>
}

export type Project = {
    id: string,
    title: string,
    synopsis: string | null,
    body: string | null,
    covers: Image[],
    tags: Tag[],
    contributor: Contributor[] ,
    links: Link[]
}

export type WriteProject = {
    title: string,
    description: string | null,
    body?: string | null,
    covers: Image[],
    tags: Tag[],
    contributors: Contributor[],
    links: Link[]
}

export type EditProject = {
    title?: string,
    description?: string | null,
    body?: string | null,
    covers?: Image[],
    links?: Link[]
}

export type Contributor = {
    userId: string
    nickname: string
    avatar?: Image
    roleTags?: Tag[]
}