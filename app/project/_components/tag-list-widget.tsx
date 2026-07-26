import Tag from "@/lib/shared/tag-system/_types/Tag";
import { Badge, Flex } from "@radix-ui/themes";

export default function TagsWidget({tags}: {tags: Tag[]}) {
  return(
    <Flex gap="2" wrap="wrap">
      { tags.map((t: Tag) => {
        //const tagName = t.getMainName()
        const primaryNames = t.name.filter(x => x.isPrimary)
        let tag = primaryNames?.find(x => x.lang == "ua")
        if(!tag) {
          tag = primaryNames.length != 0 ? primaryNames [0] : undefined
        }

        const tagName = tag?.body ?? t.getMainName()

        return(<Badge key={t.uid}>{tagName}</Badge>)
      }) }
    </Flex>
  )
}