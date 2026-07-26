'use client'

import InputBlock from "@/app/_components/ui/input-block"
import { GroupItemsDto, saveSkills, SkillTagDto } from "./action"
import { Button, Flex } from "@radix-ui/themes"
import { Dispatch, SetStateAction, useActionState, useState } from "react";
import { EMPTY_FORM_STATE } from "@/lib/utils/form-utils"
import { SkillConfigInput } from "./SkillConfigInput";
import { useTranslations } from "next-intl";

export type ReturnSkillDto = {
    sectionUid: string,
    tagIds: string[]
}

export default function SkillSection({viewModel}: {viewModel: GroupItemsDto[]}) {
    const t = useTranslations('configurator.skills')
    const [formState, action, isPending] = useActionState(saveSkills, EMPTY_FORM_STATE)

    const [allSelectedValues, setAllSelectedValues] = useState<string[][]>(
        () => viewModel.map(group => getTagsUid(group.items))
    )

    function FormDataMiddleware(data: FormData): FormData {
        const returnDto: ReturnSkillDto[] = viewModel.map((group, i) => ({
            sectionUid: group.uid,
            tagIds: allSelectedValues[i] ?? []
        }))
        data.set("stacks", JSON.stringify(returnDto))
        return data
    }

    function makeSetSelectedValues(index: number): Dispatch<SetStateAction<string[]>> {
        return (newValues) => {
            setAllSelectedValues(prev => {
                const next = [...prev]
                next[index] = typeof newValues === 'function' ? newValues(prev[index] ?? []) : newValues
                return next
            })
        }
    }

    return(
        <form action={ async (DataForm) => {
            action(FormDataMiddleware(DataForm))
        } }>
            <Flex gap="5" direction="column">
                { viewModel.map((group, i) =>
                    <InputBlock key={group.title} title={group.title} summary={ group.description ?? ""}>
                        <SkillConfigInput
                            title={group.title}
                            placeholder={ group.placeholder ?? ""}
                            values={group.items}
                            selectedValues={allSelectedValues[i] ?? []}
                            setSelectedValues={makeSetSelectedValues(i)}
                        />
                    </InputBlock>
                )}

                <Button>{t('save')}</Button>
            </Flex>
        </form>
    )
}

// helpers
function getTagsUid(tags: SkillTagDto[]): string[] {
    let selectedTagsUid: string[] = []
    for(let tag of tags) {
        if(tag.isSelected) selectedTagsUid.push(tag.uid)
    }
    return selectedTagsUid
}
