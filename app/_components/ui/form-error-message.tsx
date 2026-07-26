import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Callout } from "@radix-ui/themes"

export default function FormErrorMessage({message} : {message: string | undefined}) {
    if(message == undefined) return
    if(message == "") return
    
    return(
        <Callout.Root color="red" size="1">
            <Callout.Icon>
                <ExclamationTriangleIcon />
            </Callout.Icon>
            <Callout.Text>
                {message}
            </Callout.Text>
        </Callout.Root> 
    )
}