"use server"

import IUserService, { User } from "@/features/user/user.service.interface"
import UserService from "@/features/user/UserService"

const userService: IUserService = new UserService()

export default async function userFindAction(name?: string): Promise<User[]> {
    var result = await userService.find(name)
    return result
}