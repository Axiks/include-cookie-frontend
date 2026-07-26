"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { LinkNeko } from "@/app/_components/ui/link-neko"
import LinkNext from "next/link";
import { MenuData, MenuBasicItem, MenuMainItem } from "./config-sidebar"
import { DynamicIcon } from 'lucide-react/dynamic';
import { usePathname } from "next/navigation"


export function NavMain({
  items,
}: {
  items: MenuData
}) {
    const pathname = usePathname()

    for(var str of items.structure) {
        for(var item of str.items) {
            if(item.url == pathname) {
                item.isActive = true
            }
            else {
                item.isActive = false
            }

            if(item.items == undefined) continue
            for(var subItem of item.items){
                if(subItem.url == pathname) {
                    subItem.isActive = true
                }
                else {
                    subItem.isActive = false
                }
            }
        }
    }


  return (
    <>
      {items.structure.map(str => 
          <SidebarGroup key={str.title}>
              <SidebarGroupLabel>{str.title}</SidebarGroupLabel>
              <SidebarMenu>
                  {str.items.map((mainItem) => (
                      mainItem.items != undefined && mainItem.items.length != 0 ? <CollapibleItem key={mainItem.url} item={mainItem} /> : <BasicItem key={mainItem.url} item={mainItem} />
                  ))}
              </SidebarMenu>
          </SidebarGroup>
      )}
    </>
    
  )
}

function BasicItem({item}: {item: MenuMainItem }) {
  return(
      <SidebarMenuItem key={item.url}>
          <SidebarMenuButton asChild isActive={item.isActive}>
              <LinkNext href={item.url}>
                  {item.icon && <DynamicIcon name={item.icon} style={{shapeRendering: "unset"}} />}
                  <span>{item.title}</span>
              </LinkNext>
          </SidebarMenuButton>
      </SidebarMenuItem>
  )
}

function CollapibleItem({item}: {item: MenuMainItem }) {
    return(
        <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} isActive={item.isActive}>
                  {item.icon && <DynamicIcon name={item.icon} style={{shapeRendering: "unset"}} />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton asChild isActive={subItem.isActive}>
                        <LinkNext href={subItem.url}>
                            <span>{subItem.title}</span>
                        </LinkNext>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
    )
}