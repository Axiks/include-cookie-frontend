'use client'

import { Badge, Box, Button, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import InputBlock from "@/app/_components/ui/input-block";
import InputWrapper from "@/app/_components/ui/form-input-wrapper";
import { Dispatch, SetStateAction, useActionState, useState } from "react";
import { EMPTY_FORM_STATE } from "@/lib/utils/form-utils";
import SaveFormBtnSection from "@/app/_components/ui/save-form-btn-section";
import { Cross1Icon, Cross2Icon } from "@radix-ui/react-icons";
import { dropAll, dropData, setSchema } from "./graph-actions";
import Tag from "@/lib/shared/tag-system/_types/Tag";
import { Category } from "@/lib/shared/tag-system/_types/Category";
import { Group } from "@/lib/shared/tag-system/group/service/group.service.interface";
import { tagExtended } from "@/lib/shared/tag-system/_types/tag.extended";
import { AdminFormDTO, saveAdminConfigFormNew } from "./action";

export default function AdminConfigSection({viewModel}: {viewModel: AdminFormDTO}) {
    const [formState, action, isPending] = useActionState(saveAdminConfigFormNew, EMPTY_FORM_STATE);
    const [tags, setTags] = useState(viewModel.tags)
    const [categories, setCategories] = useState(viewModel.groups)
    

    function FormDataMiddleware(data: FormData): FormData {
        data.set("tags", JSON.stringify(tags))
        return data
    }

    return(
        <Flex direction="column" gap="5" pt="5">
                <form action={ 
                    async (DataForm) => {
                        action(FormDataMiddleware(DataForm))
                    } }>
                    <Flex direction="column" gap="5">
                        <InputBlock title="Теги" summary='Тут можеш редагувати теги'>
                            <InputWrapper fieldError={formState.fieldErrors["title"]}>
                                <TagsSection tags={tags} setTags={setTags} />
                            </InputWrapper>
                        </InputBlock>
                        <InputBlock title="Категорії" summary='Тут можеш редагувати категорії'>
                            <InputWrapper fieldError={formState.fieldErrors["category"]}>
                                <CategorySection categories={categories} setCategories={setCategories} />
                            </InputWrapper>
                        </InputBlock>
                        <InputBlock title="Лінкер" summary='Тут ти можеш link/unlink теги до категорії'>
                            <InputWrapper fieldError={formState.fieldErrors["category"]}>
                                <Text>Category search</Text>
                                <Text>Tag search</Text>
                                <Button variant="soft">Link</Button>
                            </InputWrapper>
                        </InputBlock>
                        <InputBlock title="Керування Graph DB" summary='Тут можеш управляти базою даних'>
                            <InputWrapper fieldError={formState.fieldErrors["title"]}>
                                <Flex gap="3" justify="start" align="center">
                                    <Button onClick={async() => await setSchema()} type="button" variant="soft" color="yellow">Set shema</Button>
                                    <Button onClick={async() => await dropData()} type="button" variant="soft" color="yellow">Prune data</Button>
                                    <Button onClick={async() => await dropAll()} type="button" variant="soft" color="red">Drop db</Button>
                                </Flex>
                            </InputWrapper>
                        </InputBlock>
                        
                        <Flex direction="column" pt="5">
                            <SaveFormBtnSection formState={formState} />
                        </Flex>  
                    </Flex>
                </form>
        </Flex>
    )
}

function TagsSection({tags, setTags}:{tags: Tag[], setTags: Dispatch<SetStateAction<Tag[]>> }){
    //const [tags] = useState(tagList)
    const [inputName, setInputName] = useState("")
    const [inputDescription, setInputDescription] = useState("")

    function addTag(): void {
        if(inputName == null) return
        if(inputName == "") return
        if(tags.find(x => x.name.find(y => y.body == inputName) ) != undefined) return

        const newTag: Tag = new Tag( "", [{ body: inputName }], [{ body: inputDescription }] )
        setTags([...tags, newTag])
        setInputName("")
        setInputDescription("")
    }

    function removeTag(name: string) {
        const newTags: Tag[] = tags.filter(t => t.name.filter(y => y.body != name))
        setTags(newTags)
    }

    return(
        <Flex direction="column" gap="3">
            <Flex gap="2" wrap="wrap">
                {tags.map(tag => <TagWidjet key={tag.uid || tagExtended(tag).mainName} name={tagExtended(tag).mainName} id={tag.uid != "" ? tag.uid : undefined} isRemoveAvailable={true} isRemoveEnable={true} clickTag={(name) => ({})} removeTag={removeTag} />)}                
            </Flex>
            <Flex gap="2">
                <TextField.Root onChange={ e => { setInputName(e.target.value) }} id="tag" name="tag" variant="soft" value={inputName} placeholder="tag">
                    <TextField.Slot pr="3">#</TextField.Slot>
                </TextField.Root>
                <TextField.Root onChange={ e => { setInputDescription(e.target.value) }} id="description" name="description" variant="soft" value={inputDescription} placeholder="description">
                </TextField.Root>
                <Button type="button" onClick={ e => addTag() }>Save</Button>
            </Flex>
        </Flex>
    )
}

function CategorySection({categories, setCategories}:{categories: Group[], setCategories: Dispatch<SetStateAction<Group[]>> }){
    //const [tags] = useState(tagList)
    const [input, setInput] = useState("")

    function addTag(): void {
        if(input == null) return
        if(input == "") return
        if(categories.find(x => x.name == input) != undefined) return

        const newCategory: Group = { uid: "", name: input, description: "", items: [], lables: [] }
        setCategories([...categories, newCategory])
        setInput("")
    }

    function removeTag(name: string) {
        const newCategory: Group[] = categories.filter(t => t.name != name)
        setCategories(newCategory)
    }

    return(
        <Flex direction="column" gap="3">
            <Flex gap="2">
                {categories.map(category => <TagWidjet key={category.name} id={category.uid} name={category.name} isRemoveAvailable={true} isRemoveEnable={true} clickTag={(name) => ({})} removeTag={removeTag} />)}                
            </Flex>
            <Flex gap="2">
                <TextField.Root onChange={ e => { setInput(e.target.value) }} id="category" name="category" variant="soft" value={input} placeholder="category">
                    <TextField.Slot pr="3">#</TextField.Slot>
                </TextField.Root>
                <Button type="button" onClick={ e => addTag() }>Add categoty</Button>
            </Flex>
        </Flex>
    )
}

// function CategorySection({categories, setCategories}:{categories: Category[], setCategories: Dispatch<SetStateAction<Category[]>> }){
//     //const [tags] = useState(tagList)
//     const [input, setInput] = useState("")

//     function addTag(): void {
//         if(input == null) return
//         if(input == "") return
//         if(categories.find(x => x.name == input) != undefined) return

//         const newCategory: Category = { id: input, name: input, tags: [] }
//         setCategories([...categories, newCategory])
//         setInput("")
//     }

//     function removeTag(name: string) {
//         const newCategory: Category[] = categories.filter(t => t.name != name)
//         setCategories(newCategory)
//     }

//     return(
//         <Flex direction="column" gap="3">
//             <Flex gap="2">
//                 {categories.map(category => <TagWidjet key={category.name} name={category.name} isRemoveAvailable={true} isRemoveEnable={true} clickTag={(name) => ({})} removeTag={removeTag} />)}                
//             </Flex>
//             <Flex gap="2">
//                 <TextField.Root onChange={ e => { setInput(e.target.value) }} id="category" name="category" variant="soft" value={input} placeholder="category">
//                     <TextField.Slot pr="3">#</TextField.Slot>
//                 </TextField.Root>
//                 <Button type="button" onClick={ e => addTag() }>Add categoty</Button>
//             </Flex>
//         </Flex>
//     )
// }

export function TagWidjet({id, name, isRemoveAvailable, isRemoveEnable, clickTag, removeTag}:{id: string | undefined, name: string, isRemoveAvailable: boolean, isRemoveEnable: boolean, clickTag: (name: string, id: string | undefined) => void, removeTag: (name: string, id: string | undefined) => void}){
    return(
        <Flex gap="1" align="center">
            {/* <Badge>{name}</Badge> */}
            <Button type="button" onClick={ () => clickTag(name, id)} size="1" variant="soft" m="0">
                <Text size="1">{name}</Text>
                {/* <Badge variant="solid">{name}</Badge> */}
            </Button>
            { isRemoveEnable ?
            <IconButton type="button" size="1" variant="soft" disabled={!isRemoveAvailable} onClick={ () => removeTag(name, id) } >
                <Cross2Icon width="14" height="14" />
            </IconButton> : null }
        </Flex>
    )
}