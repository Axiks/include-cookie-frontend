import { Link } from "@radix-ui/themes";
import LinkNext from "next/link";
import type { UrlObject } from 'url';

type Url = string | UrlObject;

export function LinkNeko({href, name, children}: {href: Url, name?: string, children?: React.ReactNode}) {
    return(
        <Link asChild>
            <LinkNext href={href}>
                {(children != null) ? children : name}
            </LinkNext>
        </Link>
    )
}