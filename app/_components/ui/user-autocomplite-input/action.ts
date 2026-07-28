"use server"

import { searchUsersByNickname } from "@/lib/kratos-identities"
import { UserDto } from "@/features/user/UserDto"

export default async function userFindAction(name?: string): Promise<UserDto[]> {
    if (!name) return []
    const results = await searchUsersByNickname(name)
    return results.map(u => ({ id: u.kratosId, nickname: u.nickname, image: u.avatarUrl }))
}
