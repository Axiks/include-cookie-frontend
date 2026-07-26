'use client'

import LinkInput from "@/app/_components/ui/Link/LinkInput";
import { Text, Flex, TextArea, TextField, Box, Button } from "@radix-ui/themes";
import { Dispatch, SetStateAction, useActionState, useState } from "react";
// import { ConfigurationFormDTO, saveConfigurationForm } from "../_action/actions";
import { EMPTY_FORM_STATE } from "@/lib/utils/form-utils";
import InputWrapper from "@/app/_components/ui/form-input-wrapper";
import React from "react";
import InputBlock from "@/app/_components/ui/input-block";
import SaveFormBtnSection from "@/app/_components/ui/save-form-btn-section";
import { saveConfigurationForm, UserFormDTO } from "./action";
import { Dropzone, DropZoneArea, DropzoneDescription, DropzoneFileList, DropzoneFileListItem, DropzoneFileMessage, DropzoneMessage, DropzoneRemoveFile, DropzoneRetryFile, DropzoneTrigger, useDropzone } from "@/components/ui/dropzone";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import Image from "@/lib/shared/cdn/_types/Image";
import CoverSection from "../_components/cover-section";
import { toast } from "sonner"
import { useTranslations } from "next-intl"

const emptyFile = new File([], 'empty.png', {
  type: 'image/png',
})

export default function UserConfigSection({viewModel}: {viewModel: UserFormDTO}) {
    const t = useTranslations('configurator.profile')
    const [links, setLinks] = useState(viewModel.links)
    const [cover, setCover] = useState(viewModel.cover)
    const [avatar, setAvatar] = useState(viewModel.avatar)
    const [avatarFile, setAvatarFile] = useState(emptyFile)
    const [formState, action, isPending] = useActionState(saveConfigurationForm, EMPTY_FORM_STATE);

    
    function FormDataMiddleware(data: FormData): FormData{
        data.set("links", JSON.stringify(links))
        data.set("avatar", avatarFile)

        console.log("FormDataMiddleware")
        console.log(data)
        return data
    }

    async function handleSubmit(data: FormData) {
        action(FormDataMiddleware(data))
    }

    return(
        <form action={handleSubmit}>
            <Flex direction="column" gap="5">
                <InputBlock title={t("nickname")} summary={t("nicknameDesc")}>
                    <InputWrapper fieldError={formState.fieldErrors["nickname"]}>
                        <TextField.Root id="nickname" name="nickname" variant="soft" defaultValue={viewModel.nickname ?? ""} placeholder="Username" />
                    </InputWrapper>
                </InputBlock>

                <InputBlock title={t("about")} summary={t("aboutDesc")}>
                    <InputWrapper fieldError={formState.fieldErrors["about"]}>
                        <TextArea id="about" name="about" variant="soft" defaultValue={viewModel.about ?? ""} resize="vertical" />
                    </InputWrapper>
                </InputBlock>

                <InputBlock title={t("avatar")} summary={t("avatarDesc")}>
                    <AvatarPicker imageSrc={avatar?.src ?? ""} imageFile={avatarFile} setImageFile={setAvatarFile} />
                </InputBlock>

                <InputBlock title={t("cover")} summary={t("coverDesc")}>
                    <InputWrapper fieldError={formState.fieldErrors["cover"]}>
                        <CoverSection cover_url={cover?.src ?? null} />
                    </InputWrapper>
                </InputBlock>

                <InputBlock title={t("links")} summary={t("linksDesc")}>
                    <InputWrapper fieldError={formState.fieldErrors["links"]}>
                        <LinkInput links={links} setLinks={setLinks} />
                    </InputWrapper>
                </InputBlock>
            </Flex>
            <Flex direction="column" justify="end" pt="5">
                <SaveFormBtnSection formState={formState} />
            </Flex>
        </form>
    )
}

export function AvatarPicker({imageSrc, imageFile, setImageFile}: {imageSrc: string, imageFile: File, setImageFile: Dispatch<SetStateAction<File>>}) {
  const t = useTranslations('configurator.profile')
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const url: string = URL.createObjectURL(file)
      setImageFile(file)
      return {
        status: "success",
        result: url
      };
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
      },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  });
 
  const avatarSrc = dropzone.fileStatuses[0]?.result ?? imageSrc;
  const isPending = dropzone.fileStatuses[0]?.status === "pending";

  return (
    <Dropzone {...dropzone}>
      <div className="flex justify-between">
        <DropzoneMessage />
      </div>
      <DropZoneArea style={{backgroundColor: "transparent", borderWidth: "0px"}}>
        <DropzoneTrigger>
          <Flex gap="3" align="center" p="5">
            <Avatar className={cn(isPending && "animate-pulse")}>
                <AvatarImage className="object-cover" src={avatarSrc} />
                <AvatarFallback>JG</AvatarFallback>
            </Avatar>
            <Flex direction="column">
                <Text>{t('avatarUpload')}</Text>
                <Text size="1">{t('avatarSize')}</Text>
            </Flex>
          </Flex>
        </DropzoneTrigger>
      </DropZoneArea>
    </Dropzone>
  );
}

export function SonnerDemo() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
    >
      Show Toast
    </Button>
  )
}