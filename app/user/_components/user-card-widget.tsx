import { Avatar, AvatarImage } from "@/app/_components/ui/avatar-image";
import { LinkNeko } from "@/app/_components/ui/link-neko";
import { WebUserSummary } from "@/lib/kratos-identities";
import { Box, Card, Flex, Link, Text } from "@radix-ui/themes";

export async function UserCardWidget({user}: {user: WebUserSummary}){

    return(
        <Card key={user.kratosId}>
            <Flex gap="3" align="start" wrap="wrap">
                <Avatar>
                    <AvatarImage src={user.avatarUrl ?? undefined} width={64} height={64} />
                </Avatar>
                <Box>
                    <LinkNeko href={"user/" + user.kratosId}>
                        <Text as="div" size="2" weight="bold">
                            { user.nickname }
                        </Text>
                    </LinkNeko>

                    <Text as="div" size="2" color="gray" wrap="wrap">
                        { user.about }
                    </Text>
                    <Flex gap="2" pt="2" wrap="wrap">
                        { user.links?.map((link) => (<Flex key={link.url} gap="1"><Link size="1" href={ link.url } target="_blank">{ link.name }</Link>  </Flex>) ) }
                    </Flex>
                </Box>
            </Flex>
        </Card>
    )
}
