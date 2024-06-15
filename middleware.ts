import NextAuth from 'next-auth'
import { config as nextConfig } from './auth'

export default NextAuth(nextConfig).auth

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
