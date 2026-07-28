import NextAuth, { User } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers"
import { authConfig } from "./auth.config"
import { consumePasskeyToken } from "./lib/passkey-session"
import { consumeTelegramToken } from "./lib/telegram-session"
import { fetchKratosIdentity } from "./features/auth/kratos-bridge"

function avatarUrl(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined
  return raw.startsWith('http') ? raw : '/cdn/avatars/' + raw
}

const KRATOS_PUBLIC_URL = process.env.KRATOS_PUBLIC_URL ?? "http://kratos:4433"

// Builds the NextAuth session user straight from Kratos traits — the sole profile store.
async function toSessionUser(kratosId: string): Promise<User | null> {
  const identity = await fetchKratosIdentity(kratosId)
  if (!identity) return null
  return {
    id: kratosId,
    name: identity.nickname ?? undefined,
    image: avatarUrl(identity.avatarUrl),
    kratosId,
  } satisfies User
}

const providers: Provider[] = [
    Credentials({
      id: 'kratos',
      name: 'Passkey',
      credentials: {
        kratosSessionToken: { type: 'text' },
      },
      authorize: async (credentials) => {
        const sessionToken = credentials.kratosSessionToken as string
        if (!sessionToken) return null

        const sessionRes = await fetch(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
          headers: { "X-Session-Token": sessionToken },
        })
        if (!sessionRes.ok) return null

        const sessionData = await sessionRes.json()
        const kratosId: string | undefined = sessionData.identity?.id
        if (!kratosId) return null

        return await toSessionUser(kratosId)
      },
    }),
    Credentials({
      id: 'telegram',
      name: 'Telegram',
      credentials: {
        verifyToken: { type: 'text' },
      },
      authorize: async (credentials) => {
        const verifyToken = credentials.verifyToken as string
        if (!verifyToken) return null

        const data = await consumeTelegramToken(verifyToken)
        if (!data) return null

        return await toSessionUser(data.kratosId)
      },
    }),
    Credentials({
      id: 'passkey',
      name: 'Passkey',
      credentials: {
        verifyToken: { type: 'text' },
      },
      authorize: async (credentials) => {
        const verifyToken = credentials.verifyToken as string
        if (!verifyToken) return null

        const data = await consumePasskeyToken(verifyToken)
        if (!data) return null

        return await toSessionUser(data.kratosId)
      },
    }),
]

export const providerMap = providers
  .map((provider) => {
    if (typeof provider === "function") {
      const providerData = provider()
      return { id: providerData.id, name: providerData.name }
    } else {
      return { id: provider.id, name: provider.name }
    }
  })
  .filter((provider) => provider.id !== "credentials")

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  ...authConfig,
  providers: providers,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session: updateData }: any) {
      if (user?.kratosId) token.kratosId = user.kratosId
      if (trigger === 'update' && updateData?.user?.image) {
        token.picture = updateData.user.image
      }
      return token
    },
    async session({ session, token }) {
      return ({
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          kratosId: token.kratosId as string | undefined,
          image: (token.picture as string | undefined) ?? session.user.image,
        },
      })
    },
  },
})
