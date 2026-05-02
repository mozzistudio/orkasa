'use client'

import { useState } from 'react'
import {
  Check,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import type {
  IntegrationProvider,
  IntegrationProviderMeta,
} from '@/lib/integrations'
import { PlatformLogo } from '@/components/app/platform-logo'

export function StepPlatforms({
  providers,
  onConfirm,
  onBack,
}: {
  providers: IntegrationProviderMeta[]
  onConfirm: (selected: IntegrationProvider[]) => void
  onBack: () => void
}) {
  const [selected, setSelected] = useState<Set<IntegrationProvider>>(new Set())

  function toggle(id: IntegrationProvider) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <p className="mb-4 text-[13px] text-steel">
        Elegí en qué plataformas querés publicar este listing.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {providers.map((p) => {
          const isSelected = selected.has(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`flex items-start gap-3 rounded-[4px] border p-3 text-left transition-colors ${
                isSelected
                  ? 'border-ink bg-bone/30'
                  : 'border-bone hover:border-ink'
              }`}
            >
              <PlatformLogo provider={p} size={40} />
              <div className="flex-1">
                <h3 className="text-[14px] font-medium text-ink">{p.label}</h3>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
                  {p.adapter?.titleMax
                    ? `título ${p.adapter.titleMax} · `
                    : ''}
                  desc {p.adapter?.descriptionMax} · tono {p.adapter?.tone}
                </p>
              </div>
              <div
                className={`mt-1 h-4 w-4 shrink-0 rounded-[2px] border ${
                  isSelected
                    ? 'border-ink bg-ink text-paper'
                    : 'border-bone'
                }`}
              >
                {isSelected && (
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Desktop footer */}
      <div className="mt-6 hidden md:flex items-center justify-between border-t border-bone pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[11px] text-steel">
            {selected.size} plataforma{selected.size !== 1 ? 's' : ''}
          </p>
          <button
            type="button"
            onClick={() => onConfirm(Array.from(selected))}
            disabled={selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
            Generar adaptaciones IA
          </button>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="h-24 md:hidden" />
      <div
        className="fixed inset-x-0 z-20 flex items-center gap-2 border-t border-bone bg-paper px-4 py-3 md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={onBack}
          className="rounded-[4px] border border-ink px-3 py-2.5 text-[13px] text-ink transition-colors active:bg-bone/30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={() => onConfirm(Array.from(selected))}
          disabled={selected.size === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
          Adaptar ({selected.size})
        </button>
      </div>
    </div>
  )
}
