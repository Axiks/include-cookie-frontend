import type { NextAuthConfig } from "next-auth"
import { NextResponse } from "next/server"
import { dynamicFeaturesEnabled, isDynamicRoute, isProjectsRoute, projectsCatalogEnabled } from "./lib/features"

const inDevEnvironment = !!process && process.env.NODE_ENV === 'development'

export const authConfig: NextAuthConfig = {
    pages: inDevEnvironment ? undefined : { signIn: "/signin" },
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const { pathname } = nextUrl

            // Dynamic features are temporarily disabled (production): retire their
            // routes. API/oauth endpoints answer 404; pages send visitors of retired
            // links back to the static home page. Exception: the read-only projects
            // catalog ships in production (see projectsCatalogEnabled) — its pages
            // handle catalog-service downtime themselves.
            const projectsExempt = isProjectsRoute(pathname) && projectsCatalogEnabled()
            if (!dynamicFeaturesEnabled() && isDynamicRoute(pathname) && !projectsExempt) {
                if (pathname.startsWith('/api/') || pathname.startsWith('/oauth/')) {
                    return NextResponse.json({ error: 'Not found' }, { status: 404 })
                }
                return NextResponse.redirect(new URL('/', nextUrl))
            }

            const isLoggedIn = !!auth?.user
            const isConfigurator = pathname.startsWith('/configurator')
            if (isConfigurator && !isLoggedIn) return false
            return true
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
}
