import { Avatar, AvatarImage } from "@/app/_components/ui/avatar-image";
import { LinkNeko } from "@/app/_components/ui/link-neko";
import UserAvatar from "@/app/_components/ui/user-avatar";
import { User } from "@/features/user/user.service.interface";
import { Box, Card, Flex, Link, Text } from "@radix-ui/themes";

export async function UserCardWidget({user}: {user: User}){

    return(
        <Card key={user.tgId}>
            <Flex gap="3" align="start" wrap="wrap">
                {/* <UserAvatar src={user.avatars.length != 0 ? user.avatars[0].src : null } username={user.nickname} size="3" /> */}
                <Avatar>
                    <AvatarImage src={user.avatars.length != 0 ? user.avatars[0].src : undefined } width={64} height={64} />
                </Avatar>
                <Box>
                    <LinkNeko href={"user/" + user.id}>
                        <Text as="div" size="2" weight="bold">
                            { user.nickname }
                        </Text>
                    </LinkNeko>
                    
                    <Text as="div" size="2" color="gray" wrap="wrap">
                        { user.about }
                    </Text>
                    {/* <Flex gap="2" pt="2" wrap="wrap">
                        { user.stackVotes?.map((tehn) => (<Badge key={tehn.stackId} color="orange">{ getStackName(tehn.stackId) }</Badge>) ) }
                    </Flex> */}
                    <Flex gap="2" pt="2" wrap="wrap">
                        { user.links?.map((link) => (<Flex key={link.id} gap="1"><Link size="1" href={ link.url } target="_blank">{ link.name }</Link>  </Flex>) ) }
                    </Flex>
                </Box>
            </Flex>
        </Card>
    )
}