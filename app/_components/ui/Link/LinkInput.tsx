'use client'

import { Link1Icon, Link2Icon, LinkBreak2Icon } from "@radix-ui/react-icons";
import { Box, Button, Card, Flex, Link, TextField } from "@radix-ui/themes";
import { Dispatch, SetStateAction, useState } from "react";
import z from "zod";
import FormErrorMessage from "../form-error-message";
import { useTranslations } from "next-intl";

export default function LinkInput({links, setLinks}: {links: Array<LinkViewModel>, setLinks: Dispatch<SetStateAction<LinkViewModel[]>>}) {
    const t = useTranslations('common.link')
    const [linkName, setLinkName] = useState(String)
    const [errorMessage, setErrorMessage] = useState(String)

    async function addLink(url:string): Promise<LinkViewModel | undefined> {
        const configShema = z.object({
            link: z.url(),
        })

        const result = configShema.safeParse({
            link: url
        })

        if (!result.success) {
            var errorProperties = z.treeifyError(result.error).properties?.link?.errors[0]

            setErrorMessage(errorProperties ?? "")
            return undefined
        }
        else setErrorMessage("")

        let domain = (new URL(url));

        var link: LinkViewModel = {
            url: url,
            name: domain.hostname != "" ? domain.hostname : domain.href
        }
        return link
    }

    return(
        <Flex maxWidth="32rem" direction="column" wrap="wrap">
                { links.map((link: {
                    url: string,
                    name: string
                }) => (
                    <Box pt="1" key={link.url}>
                        <Card variant="surface">
                            {/* <LinkItem url={link.url} name={link.name} /> */}

                            <Flex justify="between" align="center" wrap="wrap" gapY="2">
                                <Flex align="center" gap="2" wrap="wrap">
                                    <Link1Icon />
                                    <Link size="2" target="_blank" href={link.url}>{link.name}</Link>
                                </Flex>
                                <Button type="button" variant="ghost"
                                    onClick={async () => {
                                        var newLinks = links.filter(l => l.url != link.url)
                                        setLinks(newLinks)
                                    }}>
                                    {t('delete')}
                                    <LinkBreak2Icon />
                                </Button>
                            </Flex>
                        </Card>
                    </Box>
                ) ) }
            
            <Box pt="3">
                <Flex align="center" gap="3">
                    <Box width="100%" >
                        <TextField.Root onChange={ e => { setLinkName(e.target.value) }} placeholder="https://neko3.space" variant="soft">
                            <TextField.Slot pr="3">
                                <Link1Icon />
                            </TextField.Slot>
                        </TextField.Root>
                    </Box>
                    <Button type="button" onClick={async () => {
                        const newLink = await addLink(linkName)
                        if(newLink != undefined) setLinks([...links, newLink])
                    }}
                    >
                        {t('add')}
                        <Link2Icon />
                    </Button>
                </Flex>
                <Box pt="2" />
                <FormErrorMessage message={errorMessage}/>
            </Box>
        </Flex>
    )
}

export interface LinkViewModel {
    url: string,
    name: string
}

function LinkItem({url, name}: { url:string, name: string }){
    return(
        <Flex justify="between" align="center">
            <Flex align="center" gap="2">
                <Link1Icon />
                <Link size="2" target="_blank" href={url}>{name}</Link>
            </Flex>
            <Button variant="ghost" 
                onClick={async () => {
                    //await deleteLink("https://example.com")
                    //var newLinks = links

                    //setLinks([...links, "https://example.com"])
                }}>
                Видалити
                <LinkBreak2Icon />
            </Button>
        </Flex>
    )
}

