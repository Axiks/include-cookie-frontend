`use client`

import { Button, Flex, TextField } from "@radix-ui/themes";
import { Dispatch, KeyboardEvent, SetStateAction, useEffect, useState } from "react";
import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { PlusIcon } from "@radix-ui/react-icons";
import tagFindAction from "./action";
import { TagWidjet } from "@/app/configurator/admin/AdminConfigSegment";

export default function TagAutocompleteInput({addedTags, setAddedTags}: {addedTags: Tag[], setAddedTags: Dispatch<SetStateAction<Tag[]>>}) {    
    const [inputName, setInputName] = useState("")

    const initSugestion: TagData[] = []
    const [suggestions, setSuggestions] = useState(initSugestion);

     useEffect(() => {
        if (!inputName) {
            setSuggestions([]);
            return;
        }

        const handle = setTimeout(async () => {
            const res = await tagFindAction(inputName);
            console.log("new sugestion")
            console.log(res)
            setSuggestions(res);
        }, 250);

        return () => clearTimeout(handle);
    }, [inputName]);

    function addTag(id: string | undefined, name: string) {
        if(name === "") return

        const addedTag: Tag = new Tag(id ?? "", [{ body: name }], null)

        setAddedTags([...addedTags, addedTag])
        setInputName("")
    }

    function removeTag(tag: Tag) {
        const newList = tag.uid != "" 
            ? addedTags.filter(x => x.uid != tag.uid) 
            : addedTags.filter(x => x.name != tag.name)

        //const newList = addedTags.filter(x => x.name != name)
        setAddedTags(newList)
            //const newCategory: Category[] = categories.filter(t => t.name != name)
            //setCategories(newCategory)
    }

    function keyListner(key: KeyboardEvent<HTMLInputElement>): void {
         key.code === "Enter" ? addTag(undefined, inputName) : null
         if(key.code === "Delete") {
            if(addedTags.length <= 0) return
            removeTag(addedTags[addedTags.length-1])
         }

         if(key.code === "Backspace") {
            if(addedTags.length <= 0) return
            if(inputName.length === 0) removeTag(addedTags[addedTags.length-1])
         }
    }

    return(
        <Flex direction="column" gap="2">
            <TextField.Root
                autoComplete="off"
                onKeyDownCapture={ (key) => keyListner(key)}
                onChange={ e => { 
                    setInputName(e.target.value)
                 }} 
                id="name" name="name" variant="soft" 
                value={inputName} placeholder="Add a tag..">
                    <TextField.Slot pr="3">
                        <Flex align="center" gap="1">
                            {addedTags.length > 0 && (
                                <>
                                    {addedTags.map(tag => (
                                        // <Badge key={tag.id}>{tag.name}</Badge>
                                        <TagWidjet key={tag.uid || tag.getMainName()} id={tag.uid} 
                                            name={tag.getMainName()} 
                                            isRemoveAvailable={true} 
                                            isRemoveEnable={true} 
                                            clickTag={(name) => ({})} 
                                            removeTag={ (name, id) => { removeTag(tag) } } />
                                    ))}
                                </>
                            )}
                        </Flex>
                    </TextField.Slot>
                    <Button type="button" onClick={ () => addTag(undefined, inputName) }>Додати <PlusIcon /></Button>
            </TextField.Root>
            <Flex direction="row" gap="1">
                { suggestions.length > 0 && (
                    <TagsSugectionBlock suggestions={suggestions} selectedSugestion={ (name, id) => { addTag(id, name) } } />
                ) }
            </Flex>
        </Flex>
    )    
}

function TagsSugectionBlock({suggestions, selectedSugestion}: {suggestions: TagData[], selectedSugestion: (name: string, id: string | undefined) => void }) {
    return(
        <>
            {suggestions.map(tag => (
                <TagWidjet 
                    key={tag.uid} 
                    id={tag.uid} 
                    name={ tag.name[0].body } 
                    isRemoveAvailable={false} 
                    isRemoveEnable={false}
                    clickTag={(name, id) => (selectedSugestion(name, id))} 
                    removeTag={() => (null)} />
            ))}
        </>
    )
}