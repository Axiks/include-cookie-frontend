'use server'

import { Project } from "@/lib/shared/project/project.service.interface";
import { getCatalog } from "@/lib/catalog";
import { ConfigSidebar, MenuBasicItem, MenuData, MenuMainItem, MenuCategory as MenuSection } from "../_components/config-sidebar";
import { auth } from "@/auth";
import { inDevEnvironment } from "@/lib/shared/utils/helpers";
import { getTranslations } from "next-intl/server";

async function GenMenuData(): Promise<MenuData> {
    const [projects, t] = await Promise.all([
        GetCurrentUserProjects(),
        getTranslations('configurator.menu'),
    ])

    const profileMainItem: MenuMainItem = {
        title: t('profile'),
        description: t('profileDesc'),
        url: "/configurator/profile",
        icon: "user-pen"
    }
    const skillsMainItem: MenuMainItem = {
        title: t('skills'),
        description: t('skillsDesc'),
        url: "/configurator/skill",
        icon: "layers",
        isActive: false
    }

    const securityMainItem: MenuMainItem = {
        title: t('security'),
        url: "/configurator/security",
        icon: "shield",
    }

    const addProjectsMainItem: MenuMainItem = {
        title: t('addProject'),
        description: t('addProjectDesc'),
        url: "/configurator/project/create",
        icon: "plus",
    }

    var projectsMainItem: MenuMainItem = {
        title: t('myProjects'),
        description: t('myProjectsDesc'),
        url: "/configurator/project",
        icon: "sparkles",
        items: []
    }

    for(var project of projects) {
        const newMenuItem: MenuBasicItem = {
            title: project.title,
            url: "/configurator/project/" + project.id
        }
        projectsMainItem.items?.push(newMenuItem)
    }

    const adminMainItem: MenuMainItem = {
        title: t('tags'),
        url: "/configurator/admin",
        icon: "grape",
    }

    const mainSection: MenuSection = {
        title: t('main'),
        items: [profileMainItem, skillsMainItem, securityMainItem]
    }

    const projectSection: MenuSection = {
        title: t('projects'),
        items: [addProjectsMainItem, projectsMainItem]
    }

    const adminSection: MenuSection = {
        title: t('admin'),
        items: [adminMainItem]
    }

    const sections: MenuSection[] = [mainSection, projectSection, adminSection]
    const menuData: MenuData = {
        structure: sections
    }

    return menuData
}

// helpers
export async function GetCurrentUserProjects(): Promise<Project[]> {
    const projectService = getCatalog().projects()
    var projects = await (await projectService.find()).reverse()

    const session = await auth()
    const sub = session?.user?.kratosId

    if(!inDevEnvironment) {
        const currentUserProjects = projects.filter(x => x.contributor.some(y => y.userId == sub))
        projects = currentUserProjects
    }

    return projects
}

export default GenMenuData