'use client'

import { MultiSelect, MultiSelectGroup } from "@/components/multi-select";
import { Dispatch, SetStateAction, useState } from "react";
import { SkillTagDto } from "./action";

export function SkillConfigInput(
    { placeholder, title, values, selectedValues, setSelectedValues }
    : { placeholder: string, title: string, values: SkillTagDto[], selectedValues: string[], setSelectedValues: Dispatch<SetStateAction<string[]>> }
) {
    let group: MultiSelectGroup = { heading: title, options: [] }

    for(var option of values){
        group.options.push({ value: option.uid, label: option.name })
    }

    const options: MultiSelectGroup[] = [ group ]

    return (
        <MultiSelect
            options={options}
            onValueChange={setSelectedValues}
            defaultValue={selectedValues}
            autoSize={false}
            hideSelectAll={true}
            placeholder={placeholder}
            responsive={true}
            variant="default"
        />
    )
}