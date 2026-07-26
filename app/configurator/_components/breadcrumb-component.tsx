'use client'

import { LinkNeko } from "@/app/_components/ui/link-neko";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";
import { JSX } from "react";
import LinkNext from "next/link";

export default function BreadcrumbComponent() {
    const pathname = usePathname()
    let splited = pathname.split("/")
    splited = splited.slice(1)

    var elemets: JSX.Element[] = []

    var i = 0
    var path: string = ""

    while(i < splited.length) {
        // path generated
        path += "/" + splited[i]

        elemets.push(<BreadcrumbSeparator key={"sep"+i} className="hidden md:block" />)

        if(i == splited.length - 1) {
            const elemet = (
                <BreadcrumbItem key={splited[i]}>
                    <BreadcrumbPage>{splited[i]}</BreadcrumbPage>
                </BreadcrumbItem>
            )
            elemets.push(elemet)
        }
        else {
            const elemet = (
                <BreadcrumbItem key={splited[i]} className="hidden md:block">
                    <BreadcrumbLink asChild>
                        <LinkNext href={path}>{splited[i]}</LinkNext>
                    </BreadcrumbLink>
                </BreadcrumbItem>
            )
            elemets.push(elemet)
        }

        i++
    }
    
    return(
        <Breadcrumb>
            <BreadcrumbList>
                { elemets.map(x => <div key={x.key}>{x}</div>) }
            </BreadcrumbList>
        </Breadcrumb>
    )
}