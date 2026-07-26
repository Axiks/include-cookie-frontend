import { ILabelExtensionForService } from "../../_shared/label.extension"
import Tag from "../../_types/Tag"

export default interface ITagService extends ILabelExtensionForService {
    add(model: WriteTag): Promise<Tag>
    getByUid(uid: string): Promise<Tag | null>
    getByName(name: string): Promise<Tag | null>
    find(query?: string): Promise<Tag[]>
    // edit(uid: string, model: EditTag): Promise<Tag>
    delete(uid: string): Promise<void>
    setIcon(uid: string, src: string): Promise<void>
    removeIcon(uid: string): Promise<void>
    union(targetUid: string, unionUid: string): Promise<Tag>
    //split()
    addPseudonymName(uid: string, pseudonymField: Pseudonym): Promise<void>
    deletePseudonymName(uid: string, pseudonymField: Pseudonym): Promise<void>
    addPseudonymDescription(uid: string, pseudonymField: Pseudonym): Promise<void>
    deletePseudonymDescription(uid: string, pseudonymField: Pseudonym): Promise<void>
    // A synonym is just a non-primary name variant — add one via addPseudonymName (omit isPrimary),
    // remove it via deletePseudonymName. No separate synonym concept.
}

export type WriteTag = {
    name: Pseudonym[],
    description?: Pseudonym[] | null,
    isPrimary?: boolean | undefined
    // Marker labels written in the same create mutation (e.g. "user" for user-created tags).
    labels?: string[]
}

// export type EditTag = {
//     name?: string | Pseudonym[],
//     description?: string | Pseudonym[] | null
// }

// One localized text value (name or description). `isPrimary` marks the display variant for
// its language; a non-primary same-language name is a search-only synonym (e.g. a merged-away
// tag's name) — searchable/dedup-able but not shown.
export type Pseudonym = {
    body: string,
    lang?: string | null
    isPrimary?: boolean | undefined
}