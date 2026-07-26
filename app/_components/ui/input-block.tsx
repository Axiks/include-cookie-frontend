import { Flex, Text } from "@radix-ui/themes";

export default function InputBlock({title, summary, children}: {title: string, summary: string, children: React.ReactNode}) {
    return (
        <Flex direction="column">
            <Flex pb="3" gap="0" direction="column">
                <Text size="4" htmlFor="nickname">{title}</Text>
                <Text size="2" as="p" color="gray">{summary}</Text>
            </Flex>
            {children}
        </Flex>
    )
}