import { IAvatarExtension } from "@/lib/shared/_shared/avatar.service.extension.interface";
import { ICoverExtension } from "@/lib/shared/_shared/cover.service.extension.interface";
import ITagServiceExtension from "@/lib/shared/_shared/link.service.extension.interface";
import { Link } from "@/lib/shared";
import Image from "@/lib/shared/cdn/_types/Image";
import Tag from "@/lib/shared/tag-system/_types/Tag";

export default interface IUserService extends IAvatarExtension, ICoverExtension, ITagServiceExtension {
    add(write: WriteUser): Promise<User>
    edit(id: string, edit: EditUser): Promise<User>
    delete(id: string): Promise<void>

    getById(id: string): Promise<User | null>
    getByKratosId(sub: string): Promise<User | null>
    getAll(): Promise<User[]>
    find(q?: string): Promise<User[]>

    addLink(id: string, link: Link): Promise<void>
    removeLink(id: string, linkId: string): Promise<void>
}

export type User = {
  id: string,
  tgId: string | null,
  kratosId: string | null,
  nickname: string,
  about: string | null,
  avatars: Image[],
  covers: Image[],
  links: Link[],
  tags: Tag[]
}

export type WriteUser = {
    tgId: string
    nickname: string
    about: string | null
    avatars: Image[],
    links: Link[],
    tags: Tag[]
}

export type EditUser = {
    // tgId?: string | null,
    nickname?: string,
    about?: string,
}