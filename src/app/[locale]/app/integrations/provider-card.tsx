'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Check, X, Plug, ExternalLink, AlertCircle } from 'lucide-react'
import {
  type IntegrationProvider,
  type IntegrationProviderMeta,
  type IntegrationStatus,
} from '@/lib/integrations'
import {
  connectIntegration,
  disconnectIntegration,
} from './actions'

type ConnectedRow = {
  id: string
  provider: IntegrationProvider
  status: IntegrationStatus
  account_label: string | null
  last_synced_at: string | null
  last_error: string | null
}

const STATUS_DOT: Record<IntegrationStatus, string> = {
  connected: 'bg-[#0A6B3D]',
  connecting: 'bg-ink',
  error: 'bg-signal',
  expired: 'bg-signal',
  disconnected: 'bg-bone',
}

export function ProviderCard({
  meta,
  connected,
}: {
  meta: IntegrationProviderMeta
  connected: ConnectedRow | null
}) {
  const t = useTranslations('integrations')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConnect(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await connectIntegration(meta.id, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  function handleDisconnect() {
    if (!connected) return
    if (!confirm(t('disconnectConfirm'))) return
    startTransition(async () => {
      await disconnectIntegration(connected.id)
      router.refresh()
    })
  }

  const status = connected?.status ?? 'disconnected'
  const isConnected = status === 'connected'

  return (
    <>
      <div
        className={`rounded-[4px] border bg-paper p-4 transition-colors ${
          isConnected ? 'border-ink' : 'border-bone'
        }`}
      >
        {/* Header: logo + name + status dot */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone font-mono text-[13px] font-medium text-ink">
              {meta.shortLabel}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-medium text-ink">
                  {meta.label}
                </h3>
                {!meta.available && (
                  <span className="rounded-[4px] bg-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel">
                    {t('comingSoon')}
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`}
                />
                <span className="font-mono text-[10px] uppercase tracking-wider text-steel">
                  {t(`status.${status}`)}
                </span>
              </div>
            </div>
          </div>

          {meta.website && (
            <a
              href={meta.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-steel hover:text-ink transition-colors"
              aria-label="Website"
            >
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
            </a>
          )}
        </div>

        {/* Description */}
        <p className="mt-3 text-[12px] leading-relaxed text-steel line-clamp-3">
          {meta.description}
        </p>

        {/* Regions */}
        {meta.regions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {meta.regions.map((r) => (
              <span
                key={r}
                className="rounded-[4px] border border-bone px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel"
              >
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Error banner */}
        {connected?.last_error && (
          <div className="mt-3 flex items-start gap-1.5 rounded-[4px] border border-signal/30 bg-signal-soft px-2 py-1.5">
            <AlertCircle
              className="mt-0.5 h-3 w-3 shrink-0 text-signal"
              strokeWidth={1.5}
            />
            <p className="text-[11px] text-signal line-clamp-2">
              {connected.last_error}
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-bone pt-3">
          <span className="font-mono text-[10px] text-steel">
            {connected?.last_synced_at
              ? `${t('lastSynced')} ${new Date(connected.last_synced_at).toLocaleDateString('es-PA', { day: '2-digit', month: 'short' })}`
              : isConnected
                ? t('neverSynced')
                : ''}
          </span>
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-steel hover:border-signal hover:text-signal transition-colors disabled:opacity-60"
            >
              <X className="h-3 w-3" strokeWidth={1.5} />
              {t('disconnect')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-coal transition-colors"
            >
              <Plug className="h-3 w-3" strokeWidth={1.5} />
              {t('connect')}
            </button>
          )}
        </div>
      </div>

      {/* Connect modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-[4px] border border-bone bg-paper shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-bone px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-bone font-mono text-[11px] font-medium text-ink">
                  {meta.shortLabel}
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-ink">
                    {meta.label}
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-steel">
                    {meta.authMethod}
                  </p>
                </div>
              </div>
            </div>

            {!meta.available ? (
              <div className="px-5 py-6">
                <h4 className="mb-2 text-[14px] font-medium text-ink">
                  {t('modal.comingSoonTitle')}
                </h4>
                <p className="text-[13px] leading-relaxed text-steel">
                  {t('modal.comingSoonBody')}
                </p>
              </div>
            ) : (
              <form action={handleConnect} className="px-5 py-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] uppercase tracking-wider text-steel">
                      Etiqueta de la cuenta
                    </label>
                    <input
                      name="account_label"
                      type="text"
                      placeholder={`${meta.label} - principal`}
                      className="h-9 w-full rounded-[4px] border border-bone px-3 text-[13px] focus:border-ink focus:outline-none"
                    />
                  </div>
                  <div className="border-t border-bone pt-4">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-steel">
                      {t('modal.credentialsTitle')}
                    </p>
                    <div className="space-y-3">
                      {meta.credentialFields?.map((f) => (
                        <div key={f.key} className="space-y-1.5">
                          <label className="text-[12px] text-ink">
                            {f.label}
                          </label>
                          <input
                            name={f.key}
                            type={f.type}
                            required
                            className="h-9 w-full rounded-[4px] border border-bone px-3 font-mono text-[12px] focus:border-ink focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 font-mono text-[10px] leading-relaxed text-steel">
                      {t('modal.credentialsHelp')}
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[12px] text-signal">
                    {error}
                  </p>
                )}

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-bone pt-4">
                  <button
                    type="button"
                    onClick={() => !pending && setOpen(false)}
                    className="text-[13px] text-steel hover:text-ink transition-colors"
                  >
                    {t('modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
                  >
                    <Check className="h-3 w-3" strokeWidth={1.5} />
                    {pending ? '…' : t('modal.save')}
                  </button>
                </div>
              </form>
            )}

            {!meta.available && (
              <div className="flex items-center justify-end border-t border-bone px-5 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-[13px] text-steel hover:text-ink transition-colors"
                >
                  {t('modal.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
