import Cover from "@/app/_components/ui/cover";
import { LinkNeko } from "@/app/_components/ui/link-neko";
import { ProjectsShowcaseWidjet } from "@/app/_components/ui/project-showcase";
import UserAvatar from "@/app/_components/ui/user-avatar";
import TagsWidget from "@/app/project/_components/tag-list-widget";
import { auth } from "@/auth";
import IUserService from "@/features/user/user.service.interface";
import UserService from "@/features/user/UserService";
import { getUserTags } from "@/lib/catalog/user-tags";
import { getUserProjects } from "@/lib/catalog/user-projects";
import { Badge, Box, Container, DataList, Flex, Link, Text } from "@radix-ui/themes";
import { notFound } from "next/navigation";

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const userService: IUserService = new UserService()
    const user = await userService.getById(id) ?? await userService.getByKratosId(id)
    if(user == null) notFound()

    const [userTags, userProjects] = await Promise.all([
        getUserTags(user.kratosId),
        getUserProjects(user.kratosId),
    ])

    console.log("user")
    console.log(user)

    const session = await auth()

    const isCurrentUserPage = session?.user?.id! == user.id
    // const allStack = await getStacks()
    
    // function getStackName(stackId: string): string {
    //     return allStack.find(s => s.id == stackId)?.name ?? "not found"
    // }
        
    const hasCover = user.covers.length > 0
    const coverSrc = hasCover ? user.covers[user.covers.length - 1].src : undefined

    return (
        <>
            <Flex direction="column">
                {hasCover && <Cover src={coverSrc} />}
                <Box ml="3" mt={hasCover ? "-9" : "4"} position="relative" style={{ zIndex: 1, width: 'fit-content' }}>
                    <UserAvatar src={user.avatars.length > 0 ? user.avatars[0].src : undefined} username={user.nickname} size="9" />
                </Box>

                    <Flex direction="column" gap="1">
                        { isCurrentUserPage ? <Flex justify="end">
                            <LinkNeko href="/configurator/profile/">Редагувати</LinkNeko>
                        </Flex> : null }
                        
                        <DataList.Root>
                            <DataList.Item align="center">
                                <DataList.Label minWidth="88px">Nickname</DataList.Label>
                                <DataList.Value>
                                    <Text>@{user.nickname}</Text>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">About</DataList.Label>
                                <DataList.Value><Text>{user.about}</Text></DataList.Value>
                            </DataList.Item>
                            <DataList.Item>
                                <DataList.Label minWidth="88px">Links</DataList.Label>
                                <DataList.Value>
                                    <Flex gap="2">
                                        {user.links?.map((link => 
                                            <Link key={link.id} target="_blank" href={link.url}>
                                                {link.name}
                                            </Link>
                                        ))}
                                    </Flex>
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item align="center">
                                <DataList.Label minWidth="88px">Stacks</DataList.Label>
                                <DataList.Value>
                                    <TagsWidget tags={userTags} />
                                </DataList.Value>
                            </DataList.Item>
                            <DataList.Item align="center">
                                <DataList.Label minWidth="88px">Projects</DataList.Label>
                                <DataList.Value>
                                        <ProjectsShowcaseWidjet projects={userProjects} />
                                </DataList.Value>
                            </DataList.Item>
                        </DataList.Root>
                    </Flex>
            </Flex>
        </>
    )
}