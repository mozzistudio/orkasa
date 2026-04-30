'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { LogoLockup } from '@/components/ui/logo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from '@/i18n/navigation'
import { signup, type SignupResult } from './actions'
import { CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const t = useTranslations('signup')
  const [error, setError] = useState<string | null>(null)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setPending(true)
    const result: SignupResult = await signup(formData)
    setPending(false)
    if ('error' in result) {
      setError(result.error)
    } else {
      setSubmittedEmail(result.email)
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

      {/* Right — form or success */}
      <div
        className="flex w-full items-center justify-center bg-paper px-4 md:px-6 lg:w-1/2"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="w-full max-w-[400px] py-8">
          <div className="mb-8 lg:hidden">
            <LogoLockup className="h-7 text-ink" />
          </div>

          {submittedEmail ? (
            <div>
              <CheckCircle2
                className="mb-4 h-8 w-8 text-signal"
                strokeWidth={1.5}
              />
              <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
                {t('checkEmail')}
              </h1>
              <p className="mt-3 text-[13px] leading-relaxed text-steel">
                {t('checkEmailDescription', { email: submittedEmail })}
              </p>
              <p className="mt-8 text-center text-[13px] text-steel">
                {t('haveAccount')}{' '}
                <Link
                  href="/login"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  {t('loginLink')} →
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
                {t('title')}
              </h1>
              <p className="mt-2 text-[13px] text-steel">{t('subtitle')}</p>

              <form action={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[13px] text-ink">
                    {t('fullName')}
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder={t('fullNamePlaceholder')}
                    required
                    className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="brokerageName"
                    className="text-[13px] text-ink"
                  >
                    {t('brokerageName')}
                  </Label>
                  <Input
                    id="brokerageName"
                    name="brokerageName"
                    type="text"
                    placeholder={t('brokerageNamePlaceholder')}
                    className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
                  />
                </div>

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
                    minLength={8}
                    required
                    className="h-9 rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
                  />
                  <p className="font-mono text-[11px] text-steel">
                    {t('passwordHint')}
                  </p>
                </div>

                {error && (
                  <p className="text-[13px] text-signal">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-[4px] bg-ink px-4 py-2.5 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
                >
                  {pending ? '…' : t('submit')}
                </button>
              </form>

              <p className="mt-8 text-center text-[13px] text-steel">
                {t('haveAccount')}{' '}
                <Link
                  href="/login"
                  className="font-medium text-signal hover:text-signal/80"
                >
                  {t('loginLink')} →
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
