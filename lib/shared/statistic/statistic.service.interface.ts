import Tag from "../tag-system/_types/Tag"

export default interface IStatisticService {
    genPopularityByCategory(categorryId: string): Promise<PopularityInCategory>
}

// genPopularityByCategory

export type PopularityInCategory = {
    items: PopularityInCategoryItem[]
}

export type PopularityInCategoryItem = {
    tag: Tag,
    score: number
}