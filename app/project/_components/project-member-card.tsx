import { LinkNeko } from "@/app/_components/ui/link-neko";
import UserAvatar from "@/app/_components/ui/user-avatar";
import { ProjectRole } from "@/lib/shared/project/_enums/project-role.enum";
import { User } from "@/features/user/user.service.interface";
import { Badge, Box, Card, Flex, Text, Link } from "@radix-ui/themes";

export default async function ProjectMemberCard({user, role}: {user: User, role: string}){
    return(
        <Card key={user.tgId} variant="ghost">
            <Flex gap="2" direction="row" wrap="wrap" align="center">
                <UserAvatar src={user.avatars[0].src} username={user.nickname} size="2" />
                <Box pl="1">
                  <LinkNeko href={"/user/" + user.id}>
                    <Text as="div" size="2" weight="bold">
                        { user.nickname }
                    </Text>
                  </LinkNeko>
                </Box>
                <Box pl="5"><Badge>{ ProjectRole[Number(role)] }</Badge></Box>
                { user.links?.map((link) => (<Box key={link.id}><Link size="1" href={ link.url } target="_blank">{ link.name }</Link></Box>) ) }
            </Flex>
        </Card>
    )
}