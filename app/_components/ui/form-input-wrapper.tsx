import { Box } from "@radix-ui/themes"
import FormErrorMessage from "./form-error-message"

 export default function InputWrapper({
    children,
    fieldError
    }: {
    children: React.ReactNode,
    fieldError: { errors: string[] } | undefined
    }) {
        return(
            <Box>
                {children}
                { fieldError != undefined ?
                    <Box pt="2">
                        <FormErrorMessage message={fieldError.errors?.[0]} />
                    </Box> : null 
                }
            </Box>
        )
    }