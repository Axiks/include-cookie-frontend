import { IProjectService } from "@/lib/shared/project/project.service.interface"
import ITagService from "@/lib/shared/tag-system/tag/service/tag.service.interface"
import { IGroupService } from "@/lib/shared/tag-system/group/service/group.service.interface"
import { IItemService } from "@/lib/shared/tag-system/item/service/item.service.interface"
import IStatisticService from "@/lib/shared/statistic/statistic.service.interface"

// Single seam over the "Catalog/Platform" domain (projects, the tag-graph, stats).
// Today it is backed by the in-process services (LocalCatalogApi); once the Catalog
// is extracted into its own service it is swapped for a REST-backed implementation
// (RestCatalogApi) via getCatalog() — see the extraction plan and docs/catalog-api.md.
//
// We intentionally reuse the existing per-domain service interfaces: the call sites
// and the future REST client then share one contract, so the swap touches one file.
export interface ICatalogApi {
    projects(): IProjectService
    tags(): ITagService
    groups(): IGroupService
    items(): IItemService
    stats(): IStatisticService
}
