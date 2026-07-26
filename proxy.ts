import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
    matcher: [
        "/project",
        "/project/:path*",
        "/user",
        "/user/:path*",
        "/statistic",
        "/statistic/:path*",
        "/signin",
        "/signin/:path*",
        "/configurator",
        "/configurator/:path*",
        "/oauth/:path*",
        "/api/auth/:path*",
        "/api/kratos/:path*",
        "/api/passkey/:path*",
        "/api/dev/:path*",
    ],
}
