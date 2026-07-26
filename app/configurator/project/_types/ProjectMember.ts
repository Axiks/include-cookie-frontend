import Tag, { TagData } from "@/lib/shared/tag-system/_types/Tag";
import { User } from "@/features/user/user.service.interface";
import { UserDto } from "@/features/user/UserDto";

export interface ProjectMember {
    // user: UserDto;
    user: User
    // tags: TagData[];
    tags: Tag[]
    // isCanDelete: boolean;
    // isCanEdit: boolean;
}

export interface ProjectMemberDTO {
    user: UserDto
    tags: TagData[]
}
