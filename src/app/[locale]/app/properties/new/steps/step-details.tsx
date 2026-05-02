'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberStepper } from '@/components/app/number-stepper'
import { createPropertyDraft } from '../../actions'
import type { PropertyDetails, Neighborhood } from '../create-wizard'

const PROPERTY_TYPES = ['apartment', 'house', 'condo', 'land', 'commercial'] as const
const LISTING_TYPES = ['sale', 'rent'] as const

function NativeSelect({
  value,
  onChange,
  options,
  labels,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  labels: Record<string, string>
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

export function StepDetails({
  propertyId,
  details,
  neighborhoods,
  onConfirm,
}: {
  propertyId: string
  details: PropertyDetails
  neighborhoods: Neighborhood[]
  onConfirm: (details: PropertyDetails) => void
}) {
  const t = useTranslations('properties')
  const [form, setForm] = useState<PropertyDetails>(details)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const cities = [...new Set(neighborhoods.map((n) => n.city))]
  const filteredNeighborhoods = form.city
    ? neighborhoods.filter((n) => n.city === form.city)
    : neighborhoods

  function update<K extends keyof PropertyDetails>(
    key: K,
    value: PropertyDetails[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      // Persist the draft NOW (with empty images). All subsequent steps read
      // from this row — saving early prevents "Propiedad no encontrada" if
      // the user later jumps ahead or the network drops on step 2.
      const result = await createPropertyDraft({
        id: propertyId,
        ...form,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      onConfirm(form)
    })
  }

  return (
    <div className="space-y-5 md:space-y-8">
      {/* Type + operation */}
      <section className="space-y-3 md:space-y-4">
        <header className="border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Tipo y operación
          </h2>
        </header>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">
              {t('form.propertyType')}
            </Label>
            <NativeSelect
              value={form.property_type}
              onChange={(v) => update('property_type', v)}
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
              value={form.listing_type}
              onChange={(v) => update('listing_type', v)}
              options={LISTING_TYPES}
              labels={Object.fromEntries(
                LISTING_TYPES.map((l) => [l, t(`listingType.${l}`)]),
              )}
            />
          </div>
        </div>
      </section>

      {/* Price */}
      <section className="space-y-3 md:space-y-4">
        <header className="border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Precio
          </h2>
        </header>
        <div className="grid grid-cols-[1fr_88px] gap-2 md:grid-cols-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">{t('form.price')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price ?? ''}
              onChange={(e) =>
                update(
                  'price',
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
              className="h-11 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">{t('form.currency')}</Label>
            <Input
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              maxLength={3}
              className="h-11 rounded-[4px] border-bone md:h-9 text-center font-mono text-[13px] uppercase focus:border-ink focus:ring-0 md:text-left"
            />
          </div>
        </div>
      </section>

      {/* Specs */}
      <section className="space-y-3 md:space-y-4">
        <header className="border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Especificaciones
          </h2>
        </header>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
          <NumberStepper
            label={t('form.bedrooms')}
            value={form.bedrooms}
            onChange={(v) => update('bedrooms', v)}
            min={0}
            max={10}
            step={1}
          />
          <NumberStepper
            label={t('form.bathrooms')}
            value={form.bathrooms}
            onChange={(v) => update('bathrooms', v)}
            min={0}
            max={6}
            step={1}
          />
          <div className="col-span-2 space-y-1.5 md:col-span-1 md:space-y-2">
            <Label className="text-[13px] text-ink">{t('form.areaM2')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.area_m2 ?? ''}
              onChange={(e) =>
                update(
                  'area_m2',
                  e.target.value ? parseFloat(e.target.value) : null,
                )
              }
              className="h-10 rounded-[4px] border-bone md:h-9 font-mono text-[13px] tabular-nums focus:border-ink focus:ring-0"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="space-y-3 md:space-y-4">
        <header className="border-b border-bone pb-1.5 md:pb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Ubicación
          </h2>
        </header>
        <div className="space-y-1.5 md:space-y-2">
          <Label className="text-[13px] text-ink">{t('form.address')}</Label>
          <Input
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            className="h-11 rounded-[4px] border-bone md:h-9 text-[13px] focus:border-ink focus:ring-0"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">{t('form.city')}</Label>
            <NativeSelect
              value={form.city}
              onChange={(v) => {
                update('city', v)
                update('neighborhood', '')
              }}
              options={['', ...cities]}
              labels={{ '': 'Seleccionar…', ...Object.fromEntries(cities.map((c) => [c, c])) }}
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label className="text-[13px] text-ink">{t('form.neighborhood')}</Label>
            <NativeSelect
              value={form.neighborhood}
              onChange={(v) => update('neighborhood', v)}
              options={['', ...filteredNeighborhoods.map((n) => n.name)]}
              labels={{
                '': 'Seleccionar…',
                ...Object.fromEntries(filteredNeighborhoods.map((n) => [n.name, n.name])),
              }}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      {/* Footer */}
      <div className="hidden md:flex justify-end border-t border-bone pt-6">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="rounded-[4px] bg-ink px-5 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Continuar'}
        </button>
      </div>

      <div className="h-24 md:hidden" />
      <div
        className="fixed inset-x-0 z-20 flex items-center gap-2 border-t border-bone bg-paper px-4 py-3 md:hidden"
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="flex-1 rounded-[4px] bg-ink px-3 py-2.5 text-[13px] font-medium text-paper transition-colors active:bg-coal disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
