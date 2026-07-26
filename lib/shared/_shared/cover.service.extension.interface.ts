import Image from "../cdn/_types/Image";

export type CoverRecord = {
  id: string
  src: string
  kind: string
  index: number
  createdAt: Date
  projectId: string
}

export interface ICoverExtension {
    addCover(id: string, image: Image & { kind?: string }): Promise<CoverRecord | void>
    setCover(id: string, image: Image | null): Promise<void>
    removeCover(id: string, image: Image): Promise<void>
}
