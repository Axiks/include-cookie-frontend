`use client`

import { User } from "@/features/user/user.service.interface";
import { LinkBreak2Icon, Pencil1Icon, PersonIcon, PlusIcon } from "@radix-ui/react-icons";
import { Box, Button, Flex, TextField, Text, Badge, Card } from "@radix-ui/themes";
import { Dispatch, KeyboardEvent, SetStateAction, useEffect, useState } from "react";
import userFindAction from "./action";
import UserAvatar from "../user-avatar";
import { LinkNeko } from "../link-neko";
import Tag from "@/lib/shared/tag-system/_types/Tag";
import { ProjectMember, ProjectMemberDTO } from "@/app/configurator/project/_types/ProjectMember";

export default function ProjectMembersSection({addedUsers, setAddedUsers}: {addedUsers: Array<ProjectMemberDTO>, setAddedUsers: Dispatch<SetStateAction<ProjectMemberDTO[]>>}){
   const [inputUsername, setInputUsername] = useState("")

   const initSugestion: ProjectMember[] = []
    const [suggestions, setSuggestions] = useState(initSugestion);

   useEffect(() => {
        if (!inputUsername) {
            setSuggestions([]);
            return;
        }

        const handle = setTimeout(async () => {
            const users = await userFindAction(inputUsername != "" ? inputUsername : undefined);
            
            var result: ProjectMember[] = []
            for(var u of users) {
                const res: ProjectMember = {
                    user: u,
                    tags: []
                }
                result.push(res)
            }

            setSuggestions(result);
        }, 250);

        return () => clearTimeout(handle);
    }, [inputUsername]);

    function addUser(user: ProjectMember) {
        if(user == null) return

        setAddedUsers([...addedUsers, user])
        setInputUsername("")
    }

    function editUser(user: ProjectMemberDTO) {}

    function removeUser(user: ProjectMemberDTO) {
        const newList = addedUsers.filter(x => x.user.id != user.user.id) 

        setAddedUsers(newList)
    }
    
    function keyListner(key: KeyboardEvent<HTMLInputElement>): void {
        //throw new Error("Function not implemented.");
    }

    return(
        <Flex direction="column" gap="2">

            { addedUsers.length != 0 ? addedUsers.map(u => <MemberCard key={u.user.id} member={u} isCanEdit={false} clickEditBtn={(user)=>(editUser(user))} isCanDelete={false} clickDeleteBtn={((user) => removeUser(user))} />) : null }

            <TextField.Root
                autoComplete="off"
                onKeyDownCapture={ (key) => keyListner(key)}
                onChange={ e => { setInputUsername(e.target.value) }} 
                id="username" name="username" variant="soft" 
                value={inputUsername} placeholder="Add a member..">
                    {/* <TextField.Slot pr="3">
                        <Flex align="center" gap="1">
                            {addedUsers.length > 0 && (
                                <>
                                    {addedUsers.map(tag => (
                                        // <Badge key={tag.id}>{tag.name}</Badge>
                                        <TagWidjet key={tag.uid || tag.name} id={tag.uid} name={tag.name} isRemoveAvailable={true} isRemoveEnable={true} clickTag={(name) => ({})} removeTag={ (name, id) => { removeTag({ name: name, uid: id ?? "", description: "" }) } } />
                                    ))}
                                </>
                            )}
                        </Flex>
                    </TextField.Slot>
                    <Button type="button" onClick={ () => addUser(undefined, inputUsername) }>Додати <PlusIcon /></Button> */}
            </TextField.Root>

            <Flex direction="row" gap="1">
                { suggestions.length > 0 && (
                    <UsersSugectionBlock suggestions={suggestions} selectedSugestion={ (user) => { addUser(user) } } />
                ) }
            </Flex>
        </Flex>
    )


            {/* { addedUsers.map(user => 
                <Box key={user.id} pb="2"> */}
                    {/* <ProjectMemberCard  user={member.user} 
                        roles={member.roles.map(role => role.name)} 
                        isCanDelete={member.isCanDelete} 
                        isCanEdit={member.isCanEdit} /> */}
                {/* </Box>
            )}

            <Flex direction="row" justify="between" pt="3" gap="2">
                 <Box width="100%">
                    <TextField.Root placeholder="username" variant="soft">
                        <TextField.Slot pr="3">
                            <PersonIcon />
                        </TextField.Slot>
                    </TextField.Root>
                 </Box>
                <Button>Add member <PlusIcon /></Button>
            </Flex>
        </Flex> */}
}

function UsersSugectionBlock({suggestions, selectedSugestion}: {suggestions: ProjectMember[], selectedSugestion: (user: ProjectMember) => void }) {
    return(
        <>
            {suggestions.map(member => (
                <Button key={member.user.id} type="button" onClick={() => selectedSugestion(member) } variant="ghost">
                    <Text>{ member.user.nickname }</Text>
                </Button>
            ))}
        </>
    )
}

function MemberCard({member, isCanEdit, clickEditBtn, isCanDelete, clickDeleteBtn}: {member: ProjectMemberDTO, isCanEdit: boolean, clickEditBtn: (member: ProjectMemberDTO) => void, isCanDelete: boolean, clickDeleteBtn: (member: ProjectMemberDTO) => void}) {
    return(
        <Card>
            <Flex gap="3" align="center" justify="between" wrap="wrap">
                <Flex gap="3" align="center">
                    <UserAvatar src={member.user.image != null ? member.user.image : null } username={member.user.nickname} size="2" />
                    <LinkNeko href={"user/" + member.user.id}>
                        <Text as="div" size="2" weight="bold">
                            { member.user.nickname }
                        </Text>
                    </LinkNeko>
                    <Flex gap="2" wrap="wrap">
                        { member.tags.map((tag) => <Badge key={tag.uid}>{ tag.name[0].body }</Badge>)}
                    </Flex>
                </Flex>
                <Flex gap="5">
                    <Button hidden={!isCanEdit} variant="ghost" onClick={() => clickEditBtn(member)}>Редагувати <Pencil1Icon /></Button>
                    <Button hidden={!isCanDelete} variant="ghost" onClick={() => clickDeleteBtn(member)}>Видалити <LinkBreak2Icon /></Button>
                </Flex>
            </Flex>
        </Card>
    )
}