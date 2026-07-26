'use client';

import { LinkNeko } from "@/app/_components/ui/link-neko";
import { usePathname } from 'next/navigation';

export default function MenuItem({title, href}: {title: string, href: string}) {
    const pathname = usePathname();
    const selectedItem = pathname === href || pathname.startsWith(href + '/');

    return(
        <LinkNeko href={href}>{selectedItem == true ? "> " : null} {title}</LinkNeko>
    )
}