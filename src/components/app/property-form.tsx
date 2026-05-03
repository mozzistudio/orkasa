'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, Send } from 'lucide-react'
import { ImageUpload, type StoredImage } from '@/components/app/image-upload'
import { AIListingReview } from '@/components/app/ai-listing-review'
import { VoiceDictate } from '@/components/app/voice-dictate'

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'land', 'commercial'] as const
const LISTING_TYPES = ['sale', 'rent'] as const
const STATUSES = [
  'draft',
  'active',
  'pending',
  'sold',
  'rented',
  'archived',
] as const

function NativeSelect({
  name,
  defaultValue,
  options,
  labels,
}: {
  name: string
  defaultValue: string
  options: readonly string[]
  labels: Record<string, string>
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue}
        required
        className="h-11 w-full appearance-none rounded-[4px] border border-bone bg-paper px-3 pr-8 text-[13px] text-ink focus:border-ink focus:outline-none focus:ring-0 md:h-9"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-steel"
        strokeWidth={1.5}
      />
    </div>
  )
}

export type PropertyFormDefaults = {
  title?: string
  description?: string | null
  property_type?: (typeof PROPERTY_TYPES)[number]
  listing_type?: (typeof LISTING_TYPES)[number]
  status?: (typeof STATUSES)[number]
  price?: number | null
  currency?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  area_m2?: number | null
  address?: string | null
  neighborhood?: string | null
  city?: string | null
  external_id?: string | null
  images?: StoredImage[]
  owner_name?: string | null
  owner_phone?: string | null
  owner_email?: string | null
}

export function PropertyForm({
  defaults = {},
  action,
  submitLabel,
  onCancel,
  brokerageId,
  propertyId,
  isCreate = false,
}: {
  defaults?: PropertyFormDefaults
  action: (formData: FormData) => Promise<{ error?: string } | void>
  submitLabel: string
  onCancel?: () => void
  brokerageId: string
  propertyId: string
  isCreate?: boolean
}) {
  const t = useTranslations('properties')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // Description is controlled so the AI Studio + voice dictation can write to it
  const [description, setDescription] = useState(defaults.description ?? '')
  // Images lifted into form state so the AI review can reorder them
  const [images, setImages] = useState<StoredImage[]>(defaults.images ?? [])
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await action(formData)
      if (result && 'error' in result && result.error) {
        setError(result.error)
      }
    })
  }

  /**
   * Submit with a `next=publish` field so the server action redirects to
   * the publish wizard instead of the property detail page.
   */
  function submitAndPublish() {
    const form = formRef.current
    if (!form) return
    // Add (or replace) a hidden `next` input
    let nextInput = form.querySelector<HTMLInputElement>('input[name="next"]')
    if (!nextInput) {
      nextInput = document.createElement('input')
      nextInput.type = 'hidden'
      nextInput.name = 'next'
      form.appendChild(nextInput)
    }
    nextInput.value = 'publish'
    form.requestSubmit()
  }

  return (
    <form
      ref={formRef}
      id="property-form"
      action={handleSubmit}
      className="space-y-8"
    >
      {/* Hidden property_id for create flow (so image uploads can use it) */}
      {isCreate && (
        <input type="hidden" name="property_id" value={propertyId} />
      )}

      {/* === SECTION 1: ESSENTIALS === */}
      <section className="space-y-3 md:space-y-4">
        <header className="flex items-baseline justify-between border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            01 · Lo esencial
          </h2>
        </header>

        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="title" className="text-[13px] text-ink">
            {t('form.title')}
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={defaults.title ?? ''}
            placeholder={t('form.titlePlaceholder')}
            required
            maxLength={200}
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>

        {/* Type + operation: 2-col on mobile (short selects), 3-col on
            desktop where status is also visible (in edit mode). */}
        <div
          className={`grid grid-cols-2 gap-2 md:gap-4 ${isCreate ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}
        >
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">
              {t('form.propertyType')}
            </Label>
            <NativeSelect
              name="property_type"
              defaultValue={defaults.property_type ?? 'apartment'}
              options={PROPERTY_TYPES}
              labels={Object.fromEntries(
                PROPERTY_TYPES.map((p) => [p, t(`type.${p}`)]),
              )}
            />
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">
              {t('form.listingType')}
            </Label>
            <NativeSelect
              name="listing_type"
              defaultValue={defaults.listing_type ?? 'sale'}
              options={LISTING_TYPES}
              labels={Object.fromEntries(
                LISTING_TYPES.map((l) => [l, t(`listingType.${l}`)]),
              )}
            />
          </div>

          {/* Status is hidden on create (always 'draft') — agents publish
              from the wizard, not by toggling status here. */}
          {!isCreate && (
            <div className="space-y-1.5 md:space-y-2">
              <Label className="text-[13px] text-ink">{t('form.status')}</Label>
              <NativeSelect
                name="status"
                defaultValue={defaults.status ?? 'draft'}
                options={STATUSES}
                labels={Object.fromEntries(
                  STATUSES.map((s) => [s, t(`status.${s}`)]),
                )}
              />
            </div>
          )}
          {isCreate && (
            <input type="hidden" name="status" value="draft" />
          )}
        </div>

        {/* Price + currency: inline on mobile (currency is 3 chars, no point
            in giving it a full row) */}
        <div className="grid grid-cols-[1fr_88px] gap-2 md:grid-cols-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="price" className="text-[13px] text-ink">
              {t('form.price')}
            </Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults.price ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="currency" className="text-[13px] text-ink">
              {t('form.currency')}
            </Label>
            <Input
              id="currency"
              name="currency"
              defaultValue={defaults.currency ?? 'USD'}
              maxLength={3}
              pattern="[A-Z]{3}"
              className="h-11 rounded-[4px] border-bone md:h-9 text-center font-mono text-[13px] uppercase focus:border-ink focus:ring-0 md:text-left"
            />
          </div>
        </div>
      </section>

      {/* === SECTION 2: SPECS === */}
      <section className="space-y-3 md:space-y-4">
        <header className="flex items-baseline justify-between border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            02 · Especificaciones
          </h2>
        </header>

        {/* Specs: 3-col always (short numerical inputs fit even on mobile) */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="bedrooms" className="text-[13px] text-ink">
              {t('form.bedrooms')}
            </Label>
            <Input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={defaults.bedrooms ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="bathrooms" className="text-[13px] text-ink">
              {t('form.bathrooms')}
            </Label>
            <Input
              id="bathrooms"
              name="bathrooms"
              type="number"
              step="0.5"
              min="0"
              defaultValue={defaults.bathrooms ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="area_m2" className="text-[13px] text-ink">
              {t('form.areaM2')}
            </Label>
            <Input
              id="area_m2"
              name="area_m2"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaults.area_m2 ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
        </div>
      </section>

      {/* === SECTION 3: LOCATION === */}
      <section className="space-y-3 md:space-y-4">
        <header className="flex items-baseline justify-between border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            03 · Ubicación
          </h2>
        </header>

        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="address" className="text-[13px] text-ink">
            {t('form.address')}
          </Label>
          <Input
            id="address"
            name="address"
            defaultValue={defaults.address ?? ''}
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="neighborhood" className="text-[13px] text-ink">
              {t('form.neighborhood')}
            </Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              defaultValue={defaults.neighborhood ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="city" className="text-[13px] text-ink">
              {t('form.city')}
            </Label>
            <Input
              id="city"
              name="city"
              defaultValue={defaults.city ?? ''}
              className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="external_id" className="text-[13px] text-ink">
              {t('form.externalId')}
            </Label>
            <Input
              id="external_id"
              name="external_id"
              defaultValue={defaults.external_id ?? ''}
              placeholder={t('form.externalIdPlaceholder')}
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] focus:border-ink focus:ring-0"
            />
          </div>
        </div>
      </section>

      {/* === SECTION 4: OWNER === */}
      <section className="space-y-3 md:space-y-4">
        <header className="border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            04 · Propietario
          </h2>
        </header>

        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="owner_name" className="text-[13px] text-ink">
            Nombre
          </Label>
          <Input
            id="owner_name"
            name="owner_name"
            defaultValue={defaults.owner_name ?? ''}
            placeholder="Juan Pérez"
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="owner_phone" className="text-[13px] text-ink">
              Teléfono / WhatsApp
            </Label>
            <Input
              id="owner_phone"
              name="owner_phone"
              type="tel"
              defaultValue={defaults.owner_phone ?? ''}
              placeholder="+507 6000-0000"
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="owner_email" className="text-[13px] text-ink">
              Email
            </Label>
            <Input
              id="owner_email"
              name="owner_email"
              type="email"
              defaultValue={defaults.owner_email ?? ''}
              placeholder="juan@email.com"
              className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
            />
          </div>
        </div>
      </section>

      {/* === SECTION 5: IMAGES === */}
      <section className="space-y-3 md:space-y-4">
        <header className="flex items-baseline justify-between border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            05 · Imágenes
          </h2>
          {/* AI review only available on edit flow — needs persisted property
              with images and form data already filled. */}
          {!isCreate && (
            <AIListingReview
              formId="property-form"
              images={images}
              onApplyText={(text) => setDescription(text)}
              onImagesChange={(next) => setImages(next)}
            />
          )}
        </header>
        <ImageUpload
          brokerageId={brokerageId}
          propertyId={propertyId}
          images={images}
          onImagesChange={setImages}
        />
      </section>

      {/* === SECTION 5: DESCRIPTION (with mobile-only voice dictation) === */}
      <section className="space-y-3 md:space-y-4">
        <header className="flex items-baseline justify-between border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            06 · Descripción
          </h2>
          {/* Voice dictation: mobile-only — fast for an agent walking the property,
              awkward on desktop where typing is faster. */}
          <div className="md:hidden">
            <VoiceDictate
              onTranscript={(chunk) =>
                setDescription((prev) =>
                  prev.length > 0 && !prev.endsWith(' ')
                    ? `${prev} ${chunk}`
                    : prev + chunk,
                )
              }
            />
          </div>
        </header>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('form.descriptionPlaceholder')}
          rows={5}
          maxLength={5000}
          className="rounded-[4px] border-bone text-[13px] focus:border-ink focus:ring-0"
        />
        <p className="font-mono text-[10px] text-steel">
          La IA va a generar 3 versiones optimizadas (portal, social, móvil) en la
          fase de publicación. Acá escribí lo que sabés del inmueble — el tono no
          importa.
        </p>
      </section>

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      {/* === FOOTER ACTIONS (desktop) === */}
      <div className="hidden md:flex items-center justify-end gap-3 border-t border-bone pt-6">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[4px] border border-ink px-4 py-2 text-[13px] text-ink transition-colors hover:bg-bone/50"
          >
            {t('back')}
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-[4px] border border-ink px-5 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-bone/50 disabled:opacity-60"
        >
          {pending ? '…' : isCreate ? 'Guardar borrador' : submitLabel}
        </button>
        {isCreate && (
          <button
            type="button"
            onClick={submitAndPublish}
            disabled={pending}
            className="inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-signal px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-signal/90 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            Guardar y publicar
          </button>
        )}
      </div>

      {/* Spacer for mobile sticky footer */}
      <div className="h-24 md:hidden" />

      {/* === STICKY FOOTER (mobile) === */}
      <div
        className="fixed inset-x-0 z-20 flex items-center gap-2 border-t border-bone bg-paper px-4 py-3 md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-[4px] border border-ink px-3 py-2.5 text-[13px] text-ink transition-colors active:bg-bone/30"
          >
            {t('back')}
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[4px] border border-ink px-3 py-2.5 text-[13px] font-medium text-ink transition-colors active:bg-bone/30 disabled:opacity-60"
        >
          {pending ? '…' : isCreate ? 'Borrador' : submitLabel}
        </button>
        {isCreate && (
          <button
            type="button"
            onClick={submitAndPublish}
            disabled={pending}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[4px] bg-signal px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-signal/80 disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
            Publicar
          </button>
        )}
      </div>
    </form>
  )
}
