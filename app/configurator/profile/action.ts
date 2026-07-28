'use server'

import { auth, unstable_update } from "@/auth";
import { updateKratosTraits } from "@/features/auth/kratos-bridge";
import { Link } from "@/lib/shared";
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
  try{
    const session = await auth()
    const kratosId = session?.user?.kratosId
    if (!kratosId) throw new Error("Not signed in")

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

    // Save uploaded image files first so we have filenames to store.
    const avatarData = formData.get("avatar") ? formData.get("avatar") : null
    const avatar: Image | null = await saveImage(avatarData, "avatars")

    const coverData = formData.get("cover") ? formData.get("cover") : null
    const cover: Image | null = await saveImage(coverData, "covers")

    // Kratos is the sole store for the whole profile (nickname/about/links/avatar/cover).
    await updateKratosTraits(kratosId, {
      nickname,
      about,
      links,
      ...(avatar ? { avatarUrl: avatar.src } : {}),
      ...(cover ? { coverUrl: cover.src } : {}),
    })

    if (avatar) {
      await unstable_update({ user: { image: `/cdn/avatars/${avatar.src}` } })
    }

    track('save-config')

    revalidatePath('/user/configurator');
    revalidatePath('/user');
    revalidatePath('/user/' + kratosId);
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

    await saveFileOnServer(buffer, catalogName, filename)

    return {src: filename}
  }

  return null
}
