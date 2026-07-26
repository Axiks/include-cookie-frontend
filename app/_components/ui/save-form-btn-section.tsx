'use client'

import { Box } from "@radix-ui/themes"
import FormErrorMessage from "./form-error-message"
import { FormState } from "@/lib/utils/form-utils"
import FormBtn from "./form-btn"
import { useTranslations } from "next-intl"

export default function SaveFormBtnSection({formState}: {formState: FormState}){
    const t = useTranslations('common')

    const SaveErrorMessage = ({formState}: {formState: FormState}) => {
        const fields = Object.keys(formState.fieldErrors)
        return(
            <Box>
                { formState.status == "ERROR"
                ?   <Box py="3">
                        <FormErrorMessage message={t('saveError', { fields: fields.toString() })} />
                    </Box>
                : null}
            </Box>
        )
    }

    return (
        <>
            <SaveErrorMessage formState={formState} />
            { formState.message != null ? <Box pb="4"><FormErrorMessage message={formState.message} /></Box> : null }
            <FormBtn label={t('save')} />
        </>
    )
}