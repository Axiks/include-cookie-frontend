import Tag from "./Tag";

export interface Category {
    id: string;
    name: string;
    tags: Tag[];
}
