import IUserService, { User } from "@/features/user/user.service.interface";
import UserService from "@/features/user/UserService";
import { Grid } from "@radix-ui/themes";
import { UserCardWidget } from "./user-card-widget";

export default async function UsersSection() {
    const userService: IUserService = new UserService()
    const users = await userService.getAll()
    return (
        <>
            <Grid mt="4" columns="1" gap="1" width="auto">
                { users.map((user: User) => (
                    <UserCardWidget key={user.id} user={user}/>
                )) }
            </Grid>
        </>
    );
}