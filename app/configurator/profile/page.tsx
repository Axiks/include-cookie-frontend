import IUserService from "@/features/user/user.service.interface";
import UserConfigSection from "./UserConfigSegment";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import UserService from "@/features/user/UserService";
import { LinkViewModel } from "@/app/_components/ui/Link/LinkInput";
import { UserFormDTO } from "./action";


export default async function UserConfig(){
    const session = await auth()
    if(session == null) redirect("/")
    const userService: IUserService = new UserService()

    var user = await userService.getById(session?.user?.id!)
    console.log("user data")
    console.log(user)
    var linksVM: LinkViewModel[] = []
    user!.links?.forEach(l => linksVM.push({ name: l.name, url: l.url }))

    var tempData: UserFormDTO = {
        nickname: user!.nickname ?? "",
        about: user!.about ?? "",
        links: linksVM,
    }

    if(user?.avatars.length != 0) {
        tempData.avatar = { src: user?.avatars[0].src ?? "" }
    }

    if(user != null && user.covers.length != 0) {
        tempData.cover = { src: user.covers[user.covers.length - 1].src }
    }

    // if(user?.tags.length != 0) {
    //     tempData.tags = user?.tags.map(t => t.packing())
    // }

    return(
        <UserConfigSection viewModel={tempData} />
    )
}