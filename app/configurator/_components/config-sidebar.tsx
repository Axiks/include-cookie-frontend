"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Layers,
  LucideIcon,
  Map,
  PieChart,
  Projector,
  Settings2,
  ShieldUser,
  Sparkles,
  SquareTerminal,
  UserPen,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import SidebarLogo from "./sidebar-brand"
import { Flex } from "@radix-ui/themes"
import { IconName } from "lucide-react/dynamic"

export type MenuData = {
    structure: MenuCategory[]
}

export type MenuCategory = {
    title: string,
    items: MenuMainItem[]
}

export type MenuMainItem = {
    title: string
    description?: string
    url: string
    icon?: IconName
    isActive?: boolean
    items?: MenuBasicItem[]
}

export type MenuBasicItem = {
    title: string
    url: string
    isActive?: boolean
}

export function ConfigSidebar({ data, ...props }: {data: MenuData}) {    
  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>

      <SidebarContent>
        <NavMain items={data} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        {/* <NavUser user={data.user} /> */}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
