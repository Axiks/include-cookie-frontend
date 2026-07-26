import Tag from "../../_types/Tag"
import { ProjectData } from "@/lib/shared/project/_types/ProjectData"
import { ItemObjectType } from "../../_types/Item"

export interface IGroupService {
    add(model: WriteGroup): Promise<Group>
    getByUid(uid: string): Promise<Group | null>
    find(q?: string): Promise<Group[]>
    edit(uid: string, model: EditGroup): Promise<Group>
    delete(uid: string): Promise<void>
    link(uid: string, item: ItemRelated): Promise<void>
    unlink(uid: string, item: ItemObjectType): Promise<void>
    // Writes a language-tagged translation of the group's canonical `name` (name@<lang>).
    // Display-only — does not change the canonical matching key.
    setNameTranslation(uid: string, lang: string, body: string): Promise<void>
}

export type Group = {
    uid: string
    name: string
    description: string | null
    items: ItemRelated[]
    lables: string[]
    // Localized display name/description variants (LocalizedText, multilingual — same model as
    // tags). `name` stays the canonical matching key; these are display-only. Resolve with
    // resolveGroupName(group, lang). A non-primary same-language name is a search-only synonym.
    names?: { body: string; lang?: string | null; isPrimary?: boolean }[]
    descriptions?: { body: string; lang?: string | null; isPrimary?: boolean }[]
    //isSystem: boolean
}

//export type ItemType = ProjectData | Tag

export type WriteGroup = {
    name: string, 
    description?: string | null, 
    //isSystem: boolean,
    labels?: string[],
    relatedItems?: ItemRelated[]
}

export type EditGroup = {
    name?: string, 
    description? : string | null,
    //labels?: string[],
    //isSystem: boolean | null,
    //isReadonly: boolean
}

export type ItemRelated = {
    object: ItemObjectType
    index?: number | null
}

// enum EntityType {
//     Tag,
//     User,
//     Project
// }

// export type GroupItem = {
//     uid: string
//     index: number | null
// }

//export type ItemType = User | Project | Tag | Link

// export type RelatedItem = {
//     item: ItemType
//     index: number | null
// }



// export type RelatedItem {
//     index: number
// }


// більш вищий левел взаємолії. Абстрактний


// enum SystemGroup {
//     core, // теги ядра (system)
//     project_development_stage,
//     degree_of_openness_to_help, // Ну сіх бажаючих; ті у кого співпадіння по навчиках; закритий;
//     link_type, // типу чи це посилання на репозиторій, сторінку проекту, донат систему ітп
//     skill_level, // на скільки добре користувач володіє навичко (добре, вивчаю, так собі тід)
//     development_status, // (phase?) типу що відбувається з проектом зараз (розробляється, ідея, призупинуто, закинуто)
//     development_stage, // на початку розробки, завершується, тестується ітп
// }
// Взаємодіє з групами, як системою
// Можна чи теги в групі... 
//      можна видаляти, (readonly)
//      може видаляти тілки адмін, 3
//      може реадгувати тільки адмін
//      може добавляти до групи тільки адмін
//      також можна зазначити котрі теги у групі є системними, а котрі користувацькими

// у перспективі добавити систему котра буде шукати наближені до групи теги, і рекомендувати

// також не треба забувати що у тегів можуть бути синоніми, і мільтимовність!

// export interface IGroupMenager {
//     //find(name: string | null)
//     //union()
//     //ununion()

//     //getGroup(uid: string) : Promise<Group>
//     getSystemGroup(group: SystemGroup): Promise<Group>
// }

// export interface IGroupMenager {
//     link(groupUid: string, entityUid: string, index: number | null): Promise<boolean>
//     unlink(groupUid: string, entityUid: string): Promise<boolean>
// }