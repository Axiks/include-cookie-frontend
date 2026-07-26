import Tag from "@/lib/shared/tag-system/_types/Tag"
import { Badge, Box, Flex, Text, Tooltip } from "@radix-ui/themes"
import { PlaneIcon, PlayIcon } from "lucide-react"
import { JSX } from 'react'

export default function DevEthapWidget({ethapList, currentEthap}:{ethapList: string[], currentEthap: string}) {
  var renderStages : Array<JSX.Element> = []

  ethapList.map((stage, index) => {
    renderStages.push(
      <Text size="2" key={index} color={stage == currentEthap ? 'blue' : undefined}>{" -> " + stage}</Text>
    )
  })

  return(
    <Box>
      {renderStages}
    </Box>
  )
}

export function DevEthapWidgetNew({ethapList, currentEthap}:{ethapList: Tag[], currentEthap: Tag}) {
  var renderStages : Array<JSX.Element> = []

  ethapList.map((stage, index) => {
    renderStages.push(
      <Text size="2" key={index} color={stage == currentEthap ? 'blue' : undefined}>{" -> " + stage}</Text>
    )
  })

  return(
    <Box key={currentEthap.uid}>
      {/* {renderStages} */}
      <Tooltip content={currentEthap.getMainDescription()}>
      <Badge size="3" radius="full">
          <Flex align="center" gap="2">
            <PlayIcon size="14" />
            <Text size="1">{currentEthap.getMainName()}</Text>
          </Flex>
      </Badge>
      </Tooltip>
    </Box>
  )
}