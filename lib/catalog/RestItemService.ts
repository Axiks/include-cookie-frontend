import { IItemService } from "@/lib/shared/tag-system/item/service/item.service.interface"
import { Item } from "@/lib/shared/tag-system/_types/Item"

// pandc does not use items() through getCatalog() (user skills go via the dedicated
// user-tags endpoints). This stub keeps ICatalogApi total without pulling the Dgraph
// ItemService into the pandc bundle. Any call is a programming error.
function ni(method: string): never {
  throw new Error(`RestItemService.${method} not implemented (pandc does not use items())`)
}

export default class RestItemService implements IItemService {
  add(): Promise<Item> { return ni("add") }
  find(): Promise<Item[]> { return ni("find") }
  getById(): Promise<Item | null> { return ni("getById") }
  getByIds(): Promise<Item[] | null> { return ni("getByIds") }
  getByUid(): Promise<Item | null> { return ni("getByUid") }
  delete(): Promise<void> { return ni("delete") }
  linkTag(): Promise<void> { return ni("linkTag") }
  unlinkTag(): Promise<void> { return ni("unlinkTag") }
  linkItem(): Promise<void> { return ni("linkItem") }
  unlinkItem(): Promise<void> { return ni("unlinkItem") }
  addFacade(): Promise<void> { return ni("addFacade") }
  removeFacade(): Promise<void> { return ni("removeFacade") }
}
