'use client'

import InputWrapper from "@/app/_components/ui/form-input-wrapper";
import LinkInput, { LinkViewModel } from "@/app/_components/ui/Link/LinkInput";
import { AspectRatio, Box, Button, Container, Flex, RadioCards, Switch, Text, TextArea, TextField } from "@radix-ui/themes";
import { ChangeEvent, useActionState, useRef, useState } from "react";
import { PlusIcon, TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import { LinkNeko } from "@/app/_components/ui/link-neko";
import InputBlock from "@/app/_components/ui/input-block";
import { EMPTY_FORM_STATE, FormState } from "@/lib/utils/form-utils";
import SaveFormBtnSection from "@/app/_components/ui/save-form-btn-section";
import { ProjectMemberDTO } from "@/app/configurator/project/_types/ProjectMember";
import Tag, { TagData, TagDto } from "@/lib/shared/tag-system/_types/Tag";
import TagAutocompleteInput from "@/app/_components/ui/tag-autocomplite-input/tag-autocomplete-input";
import ProjectMembersSection from "@/app/_components/ui/user-autocomplite-input/user-autocomplite-input";
import { saveProjectConfigForm } from "./action";
import CoverSection from "../_components/cover-section";
import { FilterGroupsFromTagsHelper } from "@/features/_helpers/TagScreenerHelper";
import { useTranslations } from "next-intl";

export default function  ProjectConfigSection({viewModel}: {viewModel: ProjectDTO}) {
    return(
        <Container>
            <Box pt="5">
                <ProjectForm viewModel={viewModel} />
            </Box>
        </Container>
    )
}

function unpackingTag(packingTag: TagData): Tag {
    return new Tag(packingTag.uid, packingTag.name, packingTag.description, packingTag.icon)
}

function unpackingTags(packingTags: TagData[]): Tag[] {
    var result: Tag[] = packingTags.map(x => unpackingTag(x))
    return result
}

function ProjectForm({viewModel}: {viewModel: ProjectDTO}) {
    const t = useTranslations('configurator.project')
    const [formState, createAction, isPending] = useActionState(saveProjectConfigForm, EMPTY_FORM_STATE);
    
    const [links, setLinks] = useState(viewModel.links)
    //const [members, setMembers] = useState(viewModel.members)
    //const [tags, setTags] = useState(viewModel.tags)

    // const [addedTags, setAddedTags] = useState(viewModel.tags);
    const [addedTags, setAddedTags] = useState(unpackingTags(viewModel.tags));

    //const initMembers: User[] = []
    // const [inputMembers, setInputMembers] = useState(initMembers)

    var isOpenForNewMembers = false
    for(const tag of viewModel.tags) {
        const asTagExist = tag.name.find(x => x.body == "Requires maintance")
        if(asTagExist != undefined) {
            isOpenForNewMembers = true
        }
    }

    const devStatusList = viewModel.transferData.developmentStatus.tags
    const devStatus = viewModel.transferData.developmentStatus.selectedTag ?? devStatusList[0] ?? null

    // console.log("devStatusList")
    // console.log(devStatusList)
    // console.log("devStatus")
    // console.log(devStatus)

    function FormDataMiddleware(data: FormData): FormData {
        if(viewModel.id) data.set("id", viewModel.id)

        data.set("links", JSON.stringify(links))
        // data.set("members", JSON.stringify(members)) // todo return only ids + tags
        data.set("tags", JSON.stringify(addedTags)) // todo retyrn only ids
        //data.set("members", JSON.stringify(members)) // todo retyrn only ids
        return data
    }

    return (
        <form action={ async (DataForm) => {
                createAction(FormDataMiddleware(DataForm))
            } }>
                <Flex direction="column" gap="5">
                    <InputBlock title={t('titleField')} summary={t('titleFieldDesc')}>
                        <InputWrapper fieldError={formState.fieldErrors["title"]}>
                            <TextField.Root id="title" name="title" variant="soft" defaultValue={viewModel.title} placeholder="Title" />
                        </InputWrapper>
                    </InputBlock>
                    <InputBlock title={t('descField')} summary={t('descFieldDesc')}>
                        <InputWrapper fieldError={formState.fieldErrors["about"]}>
                            <TextArea id="about" name="about" variant="soft" defaultValue={viewModel.description} resize="vertical" />
                        </InputWrapper>
                    </InputBlock>
                    <InputBlock title={t('tags')} summary={t('tagsDesc')}>
                        <InputWrapper fieldError={formState.fieldErrors["tags"]}>
                            <TagAutocompleteInput addedTags={addedTags} setAddedTags={setAddedTags} />
                        </InputWrapper>
                    </InputBlock>
                    <InputBlock title={t('links')} summary={t('linksDesc')}>
                        <InputWrapper fieldError={formState.fieldErrors["links"]}>
                            <LinkInput links={links} setLinks={setLinks} />
                        </InputWrapper>
                    </InputBlock>
                    <InputBlock title={t('cover')} summary={t('coverDesc')}>
                        <InputWrapper fieldError={formState.fieldErrors["cover"]}>
                            <CoverSection cover_url={viewModel.cover_url} />
                        </InputWrapper>
                    </InputBlock>
                    {devStatusList.length > 0 && (
                    <InputBlock title={t('devStage')} summary={t('devStageDesc')}>
                        <DevelopmentStatus devStatusList={unpackingTags(devStatusList)} devStatus={devStatus ? unpackingTag(devStatus) : null} />
                    </InputBlock>
                    )}
                    <InputBlock title={t('openForMembers')} summary={t('openForMembersDesc')}>
                        <Box>
                            <Switch name="isOpenForNewMembers" defaultChecked={isOpenForNewMembers} variant="soft" />
                        </Box>
                    </InputBlock>
                </Flex>
    
                <Flex direction="column" justify="end" pt="5">
                    <SaveFormBtnSection formState={formState} />
                </Flex>

                { viewModel.id
                ? <Flex direction="column" justify="end" pt="5">
                    <Box>
                        <Button type="button" variant="outline" color="red">{t('deleteProject')} <TrashIcon /></Button>
                    </Box>
                </Flex>
                : null }      
            </form>
    )
}

function DevelopmentStatus({devStatusList, devStatus}:{devStatusList: Tag[], devStatus: Tag | null}){
    // const devStatusList: Tag[] = [
    //     { uid: "idea", name: "Ідея", description: "" },
    //     { uid: "in-development", name: "У розробці", description: "" },
    //     { uid: "pause", name: "Призупинено", description: "" },
    //     { uid: "drop", name: "Закинуто", description: "" },
    //     { uid: "completed", name: "Завершено", description: "" },
    // ]

    return(
        <RadioCards.Root name="developmentStatus" variant="surface" size="1" columns={{initial: "1", sm: "5"}} defaultValue={ devStatus?.uid } >
            { devStatusList.map(status => <RadioCards.Item key={status.uid} value={status.uid}>{status.getMainName()}</RadioCards.Item>) }
        </RadioCards.Root>
    )
}

export interface ProjectDTO {
    id?: string
    title: string
    description: string
    cover_url: string | null,
    links: LinkViewModel[]
    tags: TagData[],
    //devStatus: TagData,
    members: Array<ProjectMemberDTO>
    // isOpenForNewMembers: boolean

    // // UI transfer
    //devStagesTags: TagData[]
    transferData: ProjectTransferDto
}

export interface ProjectTransferDto {
    developmentStatus: GroupTransferDto
}

export interface GroupTransferDto {
    tags: TagData[]
    selectedTag: TagData | null
}

// export interface ProjectMember {
//     user: User
//     roles: Tag[]
//     isCanDelete: boolean
//     isCanEdit: boolean
// }