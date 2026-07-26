import { Avatar, Box, Card, Flex, Text } from "@radix-ui/themes";
import GenMenuData from "./project/config";
import { LinkNeko } from "../_components/ui/link-neko";
import { MenuMainItem } from "./_components/config-sidebar";
import { DynamicIcon } from "lucide-react/dynamic";
import LinkNext from "next/link";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { BadgeCheckIcon, ChevronRightIcon } from "lucide-react";

export default async function ConfiguratorPage() {
    const menuData = await GenMenuData()
    
    return(
        <Flex direction="column">
            <Flex direction="column" gap="3">
                { menuData.structure.map(x => 
                    <Box key={x.title}>
                        { x.items.map(y => 
                            <Box key={y.url} pb="2">
                                <MenuItemCard menuItemData={y} />
                            </Box>) 
                        }
                    </Box>
                    
                ) }
            </Flex>
        </Flex>
    )
}

function MenuItemCard({menuItemData}: {menuItemData: MenuMainItem}) {
    return(
        <Item variant="outline" size="sm" asChild>
            <LinkNext href={menuItemData.url}>
                { menuItemData.icon &&  
                    <ItemMedia>
                        <DynamicIcon name={menuItemData.icon} className="size-5" style={{shapeRendering: "unset"}} />
                    </ItemMedia>
                }
                <ItemContent>
                    <ItemTitle>{menuItemData.title}</ItemTitle>
                    <ItemDescription>{menuItemData.description}</ItemDescription>
                </ItemContent>
                <ItemActions>
                    <ChevronRightIcon className="size-4" />
                </ItemActions>
            </LinkNext>
        </Item>
    )
}