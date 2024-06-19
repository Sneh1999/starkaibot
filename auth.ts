import NextAuth from 'next-auth'

import type { NextAuthConfig } from 'next-auth'

import Credentials from 'next-auth/providers/credentials'
import { validateJWT } from './lib/authHelpers'

type User = {
  id: string
}

export const config = {
  theme: {
    logo: 'https://next-auth.js.org/img/logo/logo-sm.png'
  },

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        token: { label: 'Token', type: 'text' }
      },
      async authorize(
        credentials: Partial<Record<'token', unknown>>,
        request: Request
      ): Promise<User | null> {
        const token = credentials.token as string // Safely cast to string; ensure to handle undefined case
        if (typeof token !== 'string' || !token) {
          throw new Error('Token is required')
        }
        const jwtPayload = await validateJWT(token)

        if (jwtPayload) {
          // Transform the JWT payload into your user object
          const user: User = {
            id: jwtPayload.sub || '' // Assuming 'sub' is the user ID
          }
          return user
        } else {
          return null
        }
      }
    })
  ],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === '/middleware-example') return !!auth
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token = { ...token, id: user.id }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        const { id } = token as { id: string }
        const { user } = session

        session = { ...session, user: { ...user, id } }
      }

      return session
    }
  }
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)
