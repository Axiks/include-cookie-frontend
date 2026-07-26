import { Box, Flex, Link } from "@radix-ui/themes";
import { Link as LinkModel } from '@/lib/shared'

export default function LinksWidjet({links}: {links: LinkModel[]}) {
  return(
    <Flex gap="2" wrap="wrap">
        { links.map((link) => (<Box key={link.url}><Link size="1" href={ link.url } target="_blank">{ link.name }</Link> </Box>) ) }
    </Flex>
  )
}