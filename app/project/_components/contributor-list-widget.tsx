import UserAvatar from "@/app/_components/ui/user-avatar";
import { Contributor } from "@/lib/shared/project/project.service.interface";
import { Badge, Flex, Text } from "@radix-ui/themes";

export default function ContributorsWidget({ contributors }: { contributors: Contributor[] }) {
  return(
    <>
      { contributors.map((contr) => <ContributorCard key={contr.userId} contributor={contr} />) }
    </>
  )
}

export function ContributorCard({contributor}: {contributor: Contributor}) {
  return(
    <Flex gap="5" align="center">
      <Flex gap="3" align="center">
        <UserAvatar src={contributor.avatar != undefined ? contributor.avatar.src: null } username={contributor.nickname} size="2" />
        <Text>@{contributor.nickname}</Text>
      </Flex>
      <Flex gap="1">
        { contributor.roleTags?.map(tag => <Badge key={tag.uid}>{tag.name[0].body}</Badge>) }
      </Flex>
    </Flex>
  )
}