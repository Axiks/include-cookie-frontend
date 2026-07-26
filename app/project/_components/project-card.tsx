import { LinkNeko } from "@/app/_components/ui/link-neko";
import { Contributor } from "@/lib/shared/project/project.service.interface";
import Tag from "@/lib/shared/tag-system/_types/Tag";
import { Badge, Box, Card, Flex, Heading, Link, Text } from "@radix-ui/themes";
import TagsWidget from "./tag-list-widget";

export default function ProjectCard({ title, description, author, link, tags }: { title: string, description: string, author: Contributor | null, link: string, tags: Tag[] }) {
    return (
        <Flex justify="between"  wrap="wrap" gap="2">
            <Flex wrap="wrap" gap="2">
                <LinkNeko href={link}>
                { title }
                </LinkNeko>
                <TagsWidget tags={tags} />
            </Flex>
            { author != null ? <LinkNeko href={ "user/" + author.userId }><Text size="2">@{ author.nickname }</Text></LinkNeko> : null }
        </Flex>
    );
}