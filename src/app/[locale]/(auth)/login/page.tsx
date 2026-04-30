'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { LogoLockup } from '@/components/ui/logo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { login } from './actions'

// Public demo credentials — read-only sandbox account, safe to display.
// To rotate: update Supabase auth user `demo@orkasa.app` and edit here.
const DEMO_EMAIL = 'demo@orkasa.app'
const DEMO_PASSWORD = 'orkasa-demo-2026'

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
  const [submitting, setSubmitting] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Surface ?error=... query param coming from /auth/callback
  useEffect(() => {
    const err = params.get('error')
    if (err) {
      setError(ERROR_MESSAGES[err] ?? err)
    }
  }, [params])

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSubmitting(true)
    const result = await login(formData)
    setSubmitting(false)
    if (result?.error) {
      setError(result.error)
    }
  }

  function continueAsDemo() {
    const form = formRef.current
    if (!form) return
    const email = form.elements.namedItem('email') as HTMLInputElement | null
    const password = form.elements.namedItem(
      'password',
    ) as HTMLInputElement | null
    if (!email || !password) return
    email.value = DEMO_EMAIL
    password.value = DEMO_PASSWORD
    form.requestSubmit()
  }

  return (
    <div className="flex min-h-screen">
      {/* Left — testimonial */}
      <div className="hidden w-1/2 flex-col justify-between bg-coal p-12 lg:flex">
        <LogoLockup className="h-9 text-paper" />
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
      <div
        className="flex w-full items-center justify-center bg-paper px-4 md:px-6 lg:w-1/2"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="w-full max-w-[360px] py-8">
          <div className="mb-8 lg:hidden">
            <LogoLockup className="h-9 text-ink" />
          </div>

          <h1 className="text-[24px] font-medium tracking-[-0.5px] text-ink md:text-[22px]">
            {t('title')}
          </h1>

          {/* Demo credentials banner */}
          <div className="mt-6 rounded-[4px] border border-bone bg-bone/30 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-signal" strokeWidth={1.5} />
              <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                Demo · acceso público
              </p>
            </div>
            <dl className="mt-3 space-y-1.5 font-mono text-[12px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-steel">email</dt>
                <dd className="select-all text-ink">{DEMO_EMAIL}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-steel">password</dt>
                <dd className="select-all text-ink">{DEMO_PASSWORD}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={continueAsDemo}
              disabled={submitting}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[4px] bg-signal px-3 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
            >
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              {submitting ? 'Entrando…' : 'Continuar como demo'}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-bone" />
            <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
              o con tu cuenta
            </span>
            <div className="h-px flex-1 bg-bone" />
          </div>

          <form ref={formRef} action={handleSubmit} className="space-y-4">
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
              disabled={submitting}
              className="w-full rounded-[4px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
            >
              {submitting ? 'Entrando…' : t('submit')}
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
