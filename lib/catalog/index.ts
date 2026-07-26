import type { ICatalogApi } from "@/lib/shared/catalog/catalog-api.interface"
import type { IProjectService } from "@/lib/shared/project/project.service.interface"
import type ITagService from "@/lib/shared/tag-system/tag/service/tag.service.interface"
import type { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface"
import type { IItemService } from "@/lib/shared/tag-system/item/service/item.service.interface"
import type IStatisticService from "@/lib/shared/statistic/statistic.service.interface"
import RestProjectService from "./RestProjectService"
import RestTagService from "./RestTagService"
import RestGroupService from "./RestGroupService"
import RestStatisticService from "./RestStatisticService"
import RestItemService from "./RestItemService"

// pandc-side Catalog provider — PURE REST (no Local fallback). pandc no longer bundles
// the graph/Dgraph services, so CATALOG_API_URL is required (no instant rollback). The
// Catalog service itself keeps using the Local-only getCatalog() from @/features/catalog.
class PandcCatalogApi implements ICatalogApi {
  private readonly _projects = new RestProjectService()
  private readonly _tags = new RestTagService()
  private readonly _groups = new RestGroupService()
  private readonly _items = new RestItemService()
  private readonly _stats = new RestStatisticService()

  projects(): IProjectService { return this._projects }
  tags(): ITagService { return this._tags }
  groups(): IGroupService { return this._groups }
  items(): IItemService { return this._items }
  stats(): IStatisticService { return this._stats }
}

let _catalog: ICatalogApi | null = null

export function getCatalog(): ICatalogApi {
  if (!_catalog) _catalog = new PandcCatalogApi()
  return _catalog
}

export type { ICatalogApi }
