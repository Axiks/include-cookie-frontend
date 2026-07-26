'use server'

import { auth, unstable_update } from "@/auth";
import { updateKratosTraits, resolveKratosId } from "@/features/auth/kratos-bridge";
import { Link } from "@/lib/shared";
import IUserService, { EditUser } from "@/features/user/user.service.interface";
import UserService from "@/features/user/UserService";
import { FormState, fromErrorToFormState } from "@/lib/utils/form-utils";
import z from "zod";
import track from "@/lib/track";
import { revalidatePath } from "next/cache";
import { LinkViewModel } from "@/app/_components/ui/Link/LinkInput";
import Image from "@/lib/shared/cdn/_types/Image";
import saveFileOnServer from "@/features/cdn/FileService";
import { TagData } from "@/lib/shared/tag-system/_types/Tag";

export const saveConfigurationForm = async (
  formState: FormState,
  formData: FormData
) => {
  console.log(formData)
  console.log("formData")

  const userService: IUserService = new UserService()

  try{
    const session = await auth()

    const nickname = formData.get("nickname")?.toString()
    const about = formData.get("about")?.toString()

    const linksJsonData = formData.get("links")?.toString()

    const linkShema = z.object({
      name: z.string(),
      url: z.url(),
    })
    const linksShema = z.array(linkShema)
    var links: Link[] = []
    if(linksJsonData != undefined) links = JSON.parse(linksJsonData)
    console.log("LINKS: ")
    console.log(linksJsonData)

    const currentUser = await userService.getById(session?.user?.id!)
    const currentUserLinks = currentUser?.links ?? []

    for(var link of links) {
      if(currentUserLinks.find(x => x.url == link.url)) continue
      await userService.addLink(session?.user?.id!, link)
    }

    for(var link of currentUserLinks) {
      if(links.find(x => x.url == link.url)) continue
      console.log("remove!")
      console.log(link.id)
      if(link.id) await userService.removeLink(session?.user?.id!, link.id)
    }
    

    const configShema = z.object({
      nickname: z.string().min(4).max(32),
      about: z.string().min(0).max(4096),
      links: linksShema,
    })

    configShema.parse({
      nickname: nickname,
      about: about,
      links: links,
      stacks: []
    })

    // Save uploaded image files first so we have URLs to store.
    const avatarData = formData.get("avatar") ? formData.get("avatar") : null
    const avatar: Image | null = await saveImage(avatarData, "avatars")

    const coverData = formData.get("cover") ? formData.get("cover") : null
    const cover: Image | null = await saveImage(coverData, "covers")

    // Kratos is the canonical store for the shared profile (nickname/about/avatar).
    // Write it FIRST (await): if it fails we bail out via the outer catch before
    // touching the local cache, so the two never diverge. Backfill kratosId if missing.
    const kratosId = session?.user?.kratosId || (await resolveKratosId(session?.user?.id!))
    if (kratosId) {
      await updateKratosTraits(kratosId, {
        nickname,
        about,
        ...(avatar ? { avatarUrl: avatar.src } : {}),
      })
    } else {
      console.warn('[profile] no kratosId — saving locally only (shared profile not synced)')
    }

    // Local cache (projection of the canonical Kratos profile).
    const editUser: EditUser = {
      nickname: nickname,
      about: about
    }
    await userService.edit(session?.user?.id!, editUser)

    if(avatar) {
      await userService.addAvatar(session?.user?.id!, avatar)
      await unstable_update({ user: { image: `/cdn/avatars/${avatar.src}` } })
    }
    // Cover is pandc-only (not part of the shared identity profile).
    if(cover) await userService.addCover(session?.user?.id!, cover)

    track('save-config')

    revalidatePath('/user/configurator');
    revalidatePath('/user');
    revalidatePath('/user/' + session?.user?.id!);
    revalidatePath('/statistic');
  }
  catch(error){
    return fromErrorToFormState(error);
  }
    return {
        status: 'SUCCESS' as const,
        message: null,
        fieldErrors: {},
    }
}

export interface UserFormDTO {
    nickname: string,
    about: string,
    links: Array<LinkViewModel>,
    avatar?: Image | undefined,
    cover?: Image | undefined,
    tags?: TagData[] | undefined
}

async function saveImage(image: any, catalogName: string): Promise<Image | null> {
  if (image instanceof File && image.size > 0) {
    const buffer = Buffer.from(await image.arrayBuffer());

    const crypto = require("crypto");
    let uuid = crypto.randomUUID();

    const parts = image.name.split(".");
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() : null;

    var filename: string = uuid + "." + ext

    var path = await saveFileOnServer(buffer, catalogName, filename)

    return {src: filename}
  }

  return null
}