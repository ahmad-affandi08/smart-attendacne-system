import NextAuth from 'next-auth'
import authConfig from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard')
  const isOnLogin = req.nextUrl.pathname.startsWith('/login')

  // Redirect to login if accessing dashboard without auth
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }

  // Redirect to dashboard if accessing login while authenticated
  if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL('/dashboard', req.nextUrl))
  }

  return undefined
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
