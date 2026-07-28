import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { UserDto } from "@/features/user/UserDto";

export interface ProjectMember {
    user: UserDto
    tags: Tag[]
}

export interface ProjectMemberDTO {
    user: UserDto
    tags: TagData[]
}
