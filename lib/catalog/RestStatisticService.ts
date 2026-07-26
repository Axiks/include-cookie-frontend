import IStatisticService, { PopularityInCategory } from "@/lib/shared/statistic/statistic.service.interface"
import { catalog } from "@/lib/catalog-client"
import { mapPopularity, PopularityDto } from "./dto-map"

const enc = encodeURIComponent

// pandc-side adapter implementing IStatisticService over the Catalog REST API.
export default class RestStatisticService implements IStatisticService {
  async genPopularityByCategory(categoryId: string): Promise<PopularityInCategory> {
    const dto = await catalog.getJson<PopularityDto>(`/stats/popularity?groupUid=${enc(categoryId)}`)
    return mapPopularity(dto)
  }
}
