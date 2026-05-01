'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, ImageIcon } from 'lucide-react'
import { ImageUpload, type StoredImage } from '@/components/app/image-upload'
import { createPropertyDraft } from '../../actions'
import type { PropertyDetails } from '../create-wizard'

export function StepPhotos({
  propertyId,
  brokerageId,
  images,
  details,
  onImagesChange,
  onConfirm,
  onBack,
}: {
  propertyId: string
  brokerageId: string
  images: StoredImage[]
  details: PropertyDetails
  onImagesChange: (images: StoredImage[]) => void
  onConfirm: () => void
  onBack: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    if (images.length === 0) return
    setError(null)
    startTransition(async () => {
      const result = await createPropertyDraft({
        id: propertyId,
        ...details,
        images,
      })
      if (!result.ok) {
        setError(result.error ?? 'Error guardando')
        return
      }
      onConfirm()
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-bone">
          <ImageIcon className="h-5 w-5 text-steel" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-ink">
            Fotos del inmueble
          </h2>
          <p className="font-mono text-[11px] text-steel">
            Subí hasta 12 fotos. La IA las va a analizar y mejorar.
          </p>
        </div>
      </div>

      <ImageUpload
        brokerageId={brokerageId}
        propertyId={propertyId}
        images={images}
        onImagesChange={onImagesChange}
      />

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      {/* Desktop footer */}
      <div className="hidden md:flex items-center justify-between border-t border-bone pt-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-steel hover:text-ink transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          Volver
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={images.length === 0 || pending}
          className="rounded-[4px] bg-ink px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : 'Confirmar fotos'}
        </button>
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
          onClick={handleConfirm}
          disabled={images.length === 0 || pending}
          className="flex-1 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          {pending ? '…' : 'Confirmar fotos'}
        </button>
      </div>
    </div>
  )
}
