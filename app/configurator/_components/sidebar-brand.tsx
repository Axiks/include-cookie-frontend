import BrandLogo from "@/app/_components/layout/Header/_components/brand-logo";
import { SidebarMenu, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Flex, Text } from "@radix-ui/themes";

export default function SidebarLogo(){
    // const { isMobile } = useSidebar()
    
    return (
    <SidebarMenu>
        <SidebarMenuItem>
            <SmallBrandLogo />
        </SidebarMenuItem>
    </SidebarMenu>
    )
}

function SmallBrandLogo() {
    return(
        <Flex align="center" justify="center">
            <Text id="brand-accent">&</Text>
        </Flex>
    )
}
