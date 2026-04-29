import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'
  // Supabase can also redirect with ?error=... in the query string
  const supabaseError =
    searchParams.get('error_description') ?? searchParams.get('error')

  if (supabaseError) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'auth_callback')
    return NextResponse.redirect(url)
  }

  if (!code) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'auth_callback')
    return NextResponse.redirect(url)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', 'auth_callback')
    return NextResponse.redirect(url)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
