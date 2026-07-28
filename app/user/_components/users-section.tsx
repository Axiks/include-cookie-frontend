import { listUsers } from "@/lib/kratos-identities";
import { Grid } from "@radix-ui/themes";
import { UserCardWidget } from "./user-card-widget";

export default async function UsersSection() {
    const users = await listUsers()
    return (
        <>
            <Grid mt="4" columns="1" gap="1" width="auto">
                { users.map((user) => (
                    <UserCardWidget key={user.kratosId} user={user}/>
                )) }
            </Grid>
        </>
    );
}
