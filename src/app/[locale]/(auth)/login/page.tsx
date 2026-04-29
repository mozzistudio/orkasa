'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LogoLockup } from '@/components/ui/logo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { login } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback: 'No pudimos confirmar tu email. El link puede haber expirado.',
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_not_confirmed:
    'Tu email aún no fue confirmado. Revisá tu bandeja de entrada.',
}

export default function LoginPage() {
  const t = useTranslations('login')
  const params = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  // Surface ?error=... query param coming from /auth/callback
  useEffect(() => {
    const err = params.get('error')
    if (err) {
      setError(ERROR_MESSAGES[err] ?? err)
    }
  }, [params])

  async function handleSubmit(formData: FormData) {
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — testimonial */}
      <div className="hidden w-1/2 flex-col justify-between bg-coal p-12 lg:flex">
        <LogoLockup className="h-7 text-paper" />
        <div className="max-w-md">
          <p className="text-[18px] font-medium leading-relaxed text-paper">
            &ldquo;{t('testimonial')}&rdquo;
          </p>
          <div className="mt-6">
            <p className="text-[13px] font-medium text-paper">
              {t('testimonialAuthor')}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-steel">
              {t('testimonialRole')}
            </p>
          </div>
        </div>
        <div />
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center bg-paper px-6 lg:w-1/2">
        <div className="w-full max-w-[360px]">
          <div className="mb-8 lg:hidden">
            <LogoLockup className="h-7 text-ink" />
          </div>

          <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            {t('title')}
          </h1>

          <form action={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] text-ink">
                {t('email')}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                required
                className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] text-ink">
                {t('password')}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
              />
            </div>

            {error && (
              <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-[4px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors"
            >
              {t('submit')}
            </button>
          </form>

          <p className="mt-8 text-center text-[13px] text-steel">
            {t('noAccount')}{' '}
            <Link
              href="/signup"
              className="font-medium text-signal hover:text-signal/80"
            >
              {t('register')} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
