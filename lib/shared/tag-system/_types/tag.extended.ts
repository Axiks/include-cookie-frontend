import Tag from "./Tag";

export function tagExtended(t: Tag) {
    return {
        ...t,
        get mainName() {
            return t.name[0]?.body ?? "";
        },
        get mainDescription() {
            return t.description?.[0]?.body ?? null;
        }
    };
}
