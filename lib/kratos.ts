import { IdentityApi, Configuration } from "@ory/client"

const kratosAdminUrl = process.env.KRATOS_ADMIN_URL ?? "http://localhost:4434"

export const kratosAdmin = new IdentityApi(
    new Configuration({ basePath: kratosAdminUrl })
)
