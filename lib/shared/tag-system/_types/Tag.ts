import Image from "@/lib/shared/cdn/_types/Image";
import { Pseudonym } from "../tag/service/tag.service.interface";

export interface TagData {
    uid: string
    name: Pseudonym[]
    description: Pseudonym[] | null
    icon?: Image | null
}

export default class Tag implements TagData {
    constructor(
        public uid: string,
        public name: Pseudonym[],
        public description: Pseudonym[] | null,
        public icon?: Image | null,
    ) {}

    // The normalized / canonical display name: the primary English variant, then any primary,
    // then the first name. Non-primary same-language variants are search-only synonyms, so a
    // primary is always preferred over them here. Used as the stable key for matching too.
    public getMainName(): string {
        if (this.name.length === 0) return ''
        const primaryEng = this.name.find(x => x.lang == "en" && x.isPrimary == true)?.body
        if (primaryEng) return primaryEng
        const primary = this.name.find(x => x.isPrimary == true)?.body
        if (primary) return primary
        return this.name[0].body
    }

    // Display name for `lang`: the primary variant of that language, else any variant of it (a
    // lone non-primary variant is the de-facto display name), else the main name. Synonyms —
    // non-primary variants that sit alongside a primary of the same language — are never picked.
    public getNameOrDefault(lang: string): string {
        const inLangPrimary = this.name.find(x => x.lang === lang && x.isPrimary == true && x.body)?.body
        if (inLangPrimary) return inLangPrimary
        const inLangAny = this.name.find(x => x.lang === lang && x.body)?.body
        return inLangAny ?? this.getMainName()
    }

    // Description for `lang` (synonyms don't apply to descriptions): lang match → primary →
    // first non-empty → null. Meant for UI help/reference text.
    public getDescriptionOrDefault(lang: string): string | null {
        const descs = this.description ?? []
        const inLang = descs.find(x => x.lang === lang && x.body)?.body
        if (inLang) return inLang
        const primary = descs.find(x => x.isPrimary == true && x.body)?.body
        if (primary) return primary
        return descs.find(x => x.body)?.body ?? null
    }

    public getMainDescription(): string | null {
        return this.description?.length != 0 ? this.description![0].body : null
    }

    public packing(): TagData {
        const packResult: TagData = {
            uid: this.uid,
            name: this.name,
            description: this.description,
            icon: this.icon,
        }
        return packResult
    }
}

export interface TagDto extends TagData {
    isShow?: boolean | undefined
}