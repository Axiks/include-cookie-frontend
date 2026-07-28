import UserConfigSection from "./UserConfigSegment";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { fetchKratosIdentity } from "@/features/auth/kratos-bridge";
import { LinkViewModel } from "@/app/_components/ui/Link/LinkInput";
import { UserFormDTO } from "./action";

export default async function UserConfig(){
    const session = await auth()
    if(session?.user?.kratosId == null) redirect("/")

    const identity = await fetchKratosIdentity(session.user.kratosId)
    if (identity == null) redirect("/")

    const linksVM: LinkViewModel[] = identity.links.map(l => ({ name: l.name, url: l.url }))

    const tempData: UserFormDTO = {
        nickname: identity.nickname ?? "",
        about: identity.about ?? "",
        links: linksVM,
        avatar: identity.avatarUrl ? { src: identity.avatarUrl } : undefined,
        cover: identity.coverUrl ? { src: identity.coverUrl } : undefined,
    }

    return(
        <UserConfigSection viewModel={tempData} />
    )
}