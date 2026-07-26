'use client'

import { Link } from "@radix-ui/themes";
import LinkNext from "next/link";
import { usePathname } from "next/navigation";

type Props = {
    href: string;
    name?: string;
    children?: React.ReactNode;
    // In-page anchors (e.g. /about#rule) share a pathname with their page link, so
    // opt them out of the active underline to avoid highlighting two items at once.
    activeMatch?: boolean;
};

export function NavLink({ href, name, children, activeMatch = true }: Props) {
    const pathname = usePathname();
    const target = href.split("#")[0].split("?")[0];
    const isActive =
        activeMatch &&
        (target === "/"
            ? pathname === "/"
            : pathname === target || pathname.startsWith(target + "/"));

    return (
        <Link
            asChild
            underline={isActive ? "always" : "hover"}
            aria-current={isActive ? "page" : undefined}
            style={
                isActive
                    ? { textUnderlineOffset: "6px", textDecorationThickness: "2px" }
                    : undefined
            }
        >
            <LinkNext href={href}>{children ?? name}</LinkNext>
        </Link>
    );
}
