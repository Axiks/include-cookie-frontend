import { OAuth2Api, Configuration } from "@ory/client"

const hydraAdminUrl = process.env.HYDRA_ADMIN_URL ?? "http://hydra:4445"

// Hydra admin API client — used by the login & consent handlers in app/oauth/*
export const hydraAdmin = new OAuth2Api(
    new Configuration({ basePath: hydraAdminUrl })
)
