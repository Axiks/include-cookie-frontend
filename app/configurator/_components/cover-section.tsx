'use client'

import { AspectRatio, Box, Button, Flex } from "@radix-ui/themes";
import { ChangeEvent, useRef, useState } from "react";
import { TrashIcon, UploadIcon } from "@radix-ui/react-icons";
import { useTranslations } from "next-intl";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ImageIcon } from "lucide-react";

export default function CoverSection({cover_url}: {cover_url: string | null}) {
    const t = useTranslations('cover')
    const [preview, setPreview] = useState<string | null>(cover_url);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [file, setFile] = useState<File | null>(null);

    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    const removeCover = () => {
        setPreview(null)
        setFile(null)
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
    };

    return(
        <Flex direction="column">
            
                { preview ? 
                <AspectRatio ratio={32 / 9}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview ?? ""}
                        alt="Cover"
                        style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                            borderRadius: "var(--radius-2)",
                        }}
                    />
                </AspectRatio>
                : <EmptyCover />
             }
            <Flex pt="2" gap="2">
                <Button type="button" variant="surface" onClick={openFilePicker}>{t('select')}<UploadIcon /></Button>
                <Button type="button" variant="surface" color="red" onClick={removeCover}><TrashIcon /></Button>
                <input name="cover" type="file" accept="image/*" onChange={handleChange} ref={fileInputRef} style={{ display: "none" }} />
            </Flex>
        </Flex>
    )
}

function EmptyCover() {
    const t = useTranslations('cover')
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>{t('empty')}</EmptyTitle>
                <EmptyDescription>
                    {t('emptyDesc')}
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                {/* <Button variant="outline" >
                    Upload Files
                </Button> */}
            </EmptyContent>
        </Empty>
    )
}