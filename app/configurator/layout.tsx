import { Box, Button, Container, Flex, IconButton, ScrollArea, Separator, Text } from "@radix-ui/themes";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ConfigSidebar, MenuBasicItem, MenuData, MenuMainItem, MenuCategory as MenuSection } from "./_components/config-sidebar";
import BreadcrumbComponent from "./_components/breadcrumb-component";
import menuData from "./project/config";
import GenMenuData from "./project/config";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const menuData = await GenMenuData()
    return (
        <SidebarProvider style={{borderRadius: "8px"}}>
            <ConfigSidebar data={menuData} />
            <SidebarInset className="overflow-auto" style={{backgroundColor: "inherit"}}>
                <Flex gap="5" direction="column">
                    <Flex gap="3" align="center">
                        <SidebarTrigger />
                        <Separator orientation="vertical" />
                        <BreadcrumbComponent />
                    </Flex>
                    {children}
                </Flex>
            </SidebarInset>
        </SidebarProvider>
    )
}