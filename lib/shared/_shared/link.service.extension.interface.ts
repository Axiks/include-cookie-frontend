import Tag from "../tag-system/_types/Tag"

export default interface ITagController {
    linkTag(id: string, tag: Tag): Promise<void>
    unlinkTag(id: string, tag: Tag): Promise<void>
}