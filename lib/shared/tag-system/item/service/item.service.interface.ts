import { Facade } from "../../_types/Facade"
import { Item, ItemObjectType } from "../../_types/Item"
import Tag from "../../_types/Tag"

export interface IItemService {
    add(model: WriteItem): Promise<Item>
    find(q?: string): Promise<Item[]>
    //getByObject(object: ItemObjectType): Promise<Item | null>
    getById(objectId: string): Promise<Item | null>
    getByIds(objectIds: string[]): Promise<Item[] | null>
    getByUid(uid: string): Promise<Item | null>
    delete(uid: string): Promise<void>

    linkTag(uid: string, tag: Tag): Promise<void>
    unlinkTag(uid: string, tag: Tag): Promise<void>

    // linkItem(mainItem: Item, linkedItem: Item, edgeTags?: Tag[]): Promise<void>
    linkItem(mainItem: Item, linkedItem: Item, facades: Facade): Promise<void>
    unlinkItem(mainItem: Item, linkedItem: Item): Promise<void>    
    addFacade(mainItem: Item, linkedItem: Item, facades: Facade): Promise<void>
    removeFacade(mainItem: Item, linkedItem: Item, facades: Facade): Promise<void>
}

export type WriteItem = {
    // uid: string,
    objectId: string,
    objectType: string,
    tags?: Tag[]
}