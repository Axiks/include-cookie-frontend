'use client'

import { Sort } from "@/lib/shared/_enums/sort-enum";
import { Select } from "@radix-ui/themes";
import React from "react";
import { useRouter, useSearchParams } from 'next/navigation';

export default function SortDirectionComponent({defaultValue}: { defaultValue: string }) {
    const [value, setValue] = React.useState(defaultValue.toString())
    const router = useRouter();
    const searchParams = useSearchParams();

    function onChangeSortDirection(value: string) {
        setValue(value)

        const params = new URLSearchParams(searchParams.toString());
        params.set('sort', value);

        router.push(`?${params.toString()}`);
    }

    return (
        <Select.Root defaultValue={defaultValue} value={value.toString()} onValueChange={(value) => {
            onChangeSortDirection(value.toString())
        }}>
            <Select.Trigger>{value.toString()}</Select.Trigger>
            <Select.Content>
                { Object.values(Sort)
                    // .filter((v) => !isNaN(Number(v)))
                    .map(x => <Select.Item key={x.toString()} value={x.toString()}>{x.toString()}</Select.Item>)
                }
                {/* <Select.Item value="Newest">Newest</Select.Item>
                <Select.Item value="Oldest">Oldest</Select.Item> */}
            </Select.Content>
        </Select.Root>
    );

}