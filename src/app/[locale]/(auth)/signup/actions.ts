'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export type SignupResult =
  | { success: true; email: string }
  | { error: string }

export async function signup(formData: FormData): Promise<SignupResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string)?.trim()
  const brokerageName = (formData.get('brokerageName') as string)?.trim()

  if (!email || !password || !fullName) {
    return { error: 'Faltan campos requeridos.' }
  }
  if (password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  const supabase = await createClient()
  const headersList = await headers()
  const origin =
    headersList.get('origin') ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/app`,
      data: {
        full_name: fullName,
        brokerage_name: brokerageName || `${fullName} Real Estate`,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, email }
}
