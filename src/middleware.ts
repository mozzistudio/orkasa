import createIntlMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'
import { routing } from './i18n/routing'
import { updateSession } from './lib/supabase/middleware'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  const intlResponse = intlMiddleware(request)

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

export const config = {
  // Match all paths except: api routes, Next.js internals, static files,
  // and Next.js metadata routes (icon, apple-icon, opengraph-image, etc.)
  matcher: [
    '/((?!api|_next|_vercel|icon|icon0|apple-icon|opengraph-image|twitter-image|sitemap|robots|.*\\..*).*)',
  ],
}
