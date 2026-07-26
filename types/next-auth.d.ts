import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface User {
        kratosId?: string
    }
    interface Session {
        user: {
            id: string
            kratosId?: string
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        kratosId?: string
    }
}
