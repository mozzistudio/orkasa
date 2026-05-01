'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { publishOnePortal } from '../../../properties/[id]/publish/actions'
import type {
  IntegrationProvider,
  IntegrationProviderMeta,
} from '@/lib/integrations'
import {
  ChannelStatusChip,
  type PerChannelStatus,
} from '@/components/app/publish-shared'

export function StepPublish({
  propertyId,
  providers,
}: {
  propertyId: string
  providers: IntegrationProviderMeta[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [channelStatus, setChannelStatus] = useState<
    Record<string, PerChannelStatus>
  >({})
  const [publishResult, setPublishResult] = useState<{
    published: number
    failed: number
  } | null>(null)

  useEffect(() => {
    const providerIds = providers.map((p) => p.id)
    const initial: Record<string, PerChannelStatus> = {}
    for (const id of providerIds) initial[id] = { stage: 'idle' }
    setChannelStatus(initial)

    startTransition(async () => {
      let published = 0
      let failed = 0
      for (const provider of providerIds) {
        setChannelStatus((prev) => ({
          ...prev,
          [provider]: { stage: 'publishing' },
        }))
        const result = await publishOnePortal(propertyId, provider)
        if (result.ok) {
          published++
          setChannelStatus((prev) => ({
            ...prev,
            [provider]: { stage: 'published', externalUrl: result.externalUrl },
          }))
        } else {
          failed++
          setChannelStatus((prev) => ({
            ...prev,
            [provider]: { stage: 'failed', error: result.error },
          }))
        }
      }
      setPublishResult({ published, failed })
      router.refresh()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        {pending ? (
          <Loader2
            className="h-5 w-5 animate-spin text-signal"
            strokeWidth={1.5}
          />
        ) : publishResult && publishResult.failed === 0 ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#0A6B3D]/10">
            <Check className="h-4 w-4 text-[#0A6B3D]" strokeWidth={2} />
          </div>
        ) : publishResult ? (
          <AlertCircle
            className="h-5 w-5 text-signal"
            strokeWidth={1.5}
          />
        ) : null}
        <h2 className="text-[18px] font-medium tracking-[-0.3px] text-ink md:text-[20px]">
          {pending
            ? 'Publicando…'
            : publishResult
              ? publishResult.failed === 0
                ? `${publishResult.published} canal${publishResult.published !== 1 ? 'es' : ''} publicado${publishResult.published !== 1 ? 's' : ''}`
                : `${publishResult.published} OK · ${publishResult.failed} con error`
              : 'Listo para publicar'}
        </h2>
      </div>

      <ul className="divide-y divide-bone overflow-hidden rounded-[4px] border border-bone bg-paper">
        {Object.entries(channelStatus).map(([providerId, st]) => {
          const meta = providers.find((p) => p.id === providerId)
          if (!meta) return null
          return (
            <li
              key={providerId}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-bone font-mono text-[11px] font-medium text-ink">
                {meta.shortLabel}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-medium text-ink">
                  {meta.label}
                </p>
                {st.stage === 'failed' && (
                  <p className="truncate font-mono text-[11px] text-signal">
                    {st.error}
                  </p>
                )}
                {st.stage === 'published' && (
                  <a
                    href={st.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 truncate font-mono text-[11px] text-steel transition-colors hover:text-signal"
                  >
                    Ver preview{' '}
                    <ExternalLink
                      className="h-2.5 w-2.5"
                      strokeWidth={1.5}
                    />
                  </a>
                )}
                {st.stage === 'idle' && (
                  <p className="font-mono text-[11px] text-steel">En cola…</p>
                )}
                {st.stage === 'publishing' && (
                  <p className="font-mono text-[11px] text-signal">
                    Publicando…
                  </p>
                )}
              </div>
              <div className="shrink-0">
                <ChannelStatusChip status={st.stage} />
              </div>
            </li>
          )
        })}
      </ul>

      {!pending && publishResult && (
        <div className="mt-6 border-t border-bone pt-6">
          <button
            type="button"
            onClick={() =>
              router.push(`/app/properties/${propertyId}`)
            }
            className="w-full rounded-[4px] bg-ink px-5 py-2.5 text-[13px] font-medium text-paper transition-colors hover:bg-coal md:w-auto md:py-2"
          >
            Ver propiedad
          </button>
        </div>
      )}
    </div>
  )
}
