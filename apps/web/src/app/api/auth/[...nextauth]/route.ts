import NextAuth from 'next-auth'
import { authOptions } from '@server/auth/session/auth-options'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
