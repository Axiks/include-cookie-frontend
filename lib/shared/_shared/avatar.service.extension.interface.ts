import Image from "../cdn/_types/Image";

export interface IAvatarExtension {
    addAvatar(id: string, image: Image): Promise<void>
    setAvatar(id: string, image: Image | null): Promise<void>
    removeAvatar(id: string, image: Image): Promise<void>
}