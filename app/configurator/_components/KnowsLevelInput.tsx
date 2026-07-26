import { KnowType } from "@/lib/shared/tag-system/_enums/know-type.enum"
import { Box, Card, Flex, RadioCards, Text } from "@radix-ui/themes"
import { Dispatch, SetStateAction } from "react"

export interface UserKnowStack {
    stackId: string,
    stackName: string,
    knowLevel: KnowType
}

export function KnowsLevelInput({knowsLevels, setKnowsLevels} : {knowsLevels: UserKnowStack[], setKnowsLevels: Dispatch<SetStateAction<UserKnowStack[]>>}){

    function changeKnowLevel(id: string, newKnowLevel: KnowType) {
        var value = knowsLevels.find(x => x.stackId == id)!
        value.knowLevel = newKnowLevel
        
        setKnowsLevels(knowsLevels)
    }
    
    return (
        <Box>
            { knowsLevels.map((stack: {
                    stackId: string
                    stackName: string,
                    knowLevel: KnowType
                }) => {
                    const changeValue = (value: KnowType) => {
                        console.log("handleIncrement")
                        console.log(value)

                        changeKnowLevel(stack.stackId, value)
                    };

                    return (

                        <Box key={stack.stackId} py="1">
                            {/* <LangItem name={stack.name} bage="Мова програмування" value={stack.knowLevel} onChange={ e => { changeKnowLevel(stack.id, e.target.) }} /> */}
                            <KnowItem name={stack.stackName} bage="Мова програмування" value={stack.knowLevel} changeValue={changeValue} />
                        </Box>
                    )
                } ) }
        </Box>
    )
}

function KnowItem({name, bage, value, changeValue }: { name: String, bage: String, value: KnowType, changeValue: (value: KnowType) => void }) {
    // None | Learning | Main | Casual
    return (
        <Card variant="surface">
            <Flex align="center" justify="between">
                <Flex direction="column" pr="5">
                    <Text weight="bold">{name}</Text>
                    <Text size="1">{bage}</Text>
                </Flex>

                <RadioCards.Root defaultValue={value} size="1" gap="1" columns={{ initial: "1", sm: "4" }}>
                    <RadioCards.Item value={KnowType.NONE} onClick={ e => changeValue(KnowType.NONE) }>
                        <Text size="2">Не знаю</Text> 
                    </RadioCards.Item>
                    <RadioCards.Item value={KnowType.STUDING} onClick={ e => changeValue(KnowType.STUDING) }>
                        <Text size="2">Вивчаю</Text>
                    </RadioCards.Item>
                    <RadioCards.Item value={KnowType.MAJOR} onClick={ e =>  changeValue(KnowType.MAJOR)}>
                        <Text size="2">Основна</Text>
                    </RadioCards.Item>
                    <RadioCards.Item value={KnowType.SECOND} onClick={ e =>  changeValue(KnowType.SECOND)}>
                        <Text size="2">Додаткова</Text>
                    </RadioCards.Item>
                </RadioCards.Root>
            </Flex>
        </Card>
    )
}