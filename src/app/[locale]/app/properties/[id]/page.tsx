import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft, Pencil, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils'
import { DeletePropertyButton } from './delete-button'
import type { Database } from '@/lib/database.types'
import type { StoredImage } from '@/components/app/image-upload'

type Property = Database['public']['Tables']['properties']['Row']

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('properties')
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle<Property>()

  if (!property) {
    notFound()
  }

  const dateLong = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString('es-PA', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—'

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/app/properties"
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {t('title')}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[1.5px] text-steel">
              [ ID {property.id.slice(0, 8)} ]
            </p>
            <h1 className="mt-1 text-[22px] font-medium tracking-[-0.5px] text-ink md:text-[24px]">
              {property.title}
            </h1>
            <p className="mt-1 font-mono text-[12px] text-steel">
              {[property.neighborhood, property.city].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* Desktop: inline actions */}
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href={`/app/properties/${property.id}/publish`}
              className="inline-flex items-center gap-2 rounded-[4px] bg-signal px-3 py-2 text-[13px] font-medium text-paper hover:bg-signal/90 transition-colors"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
              Publicar en portales
            </Link>
            <Link
              href={`/app/properties/${property.id}/edit`}
              className="inline-flex items-center gap-2 rounded-[4px] border border-ink px-3 py-2 text-[13px] text-ink hover:bg-bone/50 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t('edit')}
            </Link>
            <DeletePropertyButton id={property.id} />
          </div>
        </div>

        {/* Mobile: secondary actions row (Edit + Delete) — Publicar is sticky at bottom */}
        <div className="mt-4 flex items-center gap-2 md:hidden">
          <Link
            href={`/app/properties/${property.id}/edit`}
            className="flex flex-1 items-center justify-center gap-2 rounded-[4px] border border-ink px-3 py-2.5 text-[13px] text-ink"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
            {t('edit')}
          </Link>
          <DeletePropertyButton id={property.id} />
        </div>
      </div>

      {/* Mobile sticky CTA — Publicar en portales (bottom of viewport, above tab bar) */}
      <div
        className="fixed inset-x-0 z-20 border-t border-bone bg-paper p-3 md:hidden"
        style={{
          // Sit above the bottom tab bar (h-14 = 56px) + safe area
          bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <Link
          href={`/app/properties/${property.id}/publish`}
          className="flex items-center justify-center gap-2 rounded-[4px] bg-signal px-4 py-3 text-[14px] font-medium text-paper"
        >
          <Send className="h-4 w-4" strokeWidth={1.5} />
          Publicar en portales
        </Link>
      </div>

      {/* Hero band — first image if present, else dark scanlines */}
      {(() => {
        const images: StoredImage[] = Array.isArray(property.images)
          ? (property.images as unknown as StoredImage[])
          : []
        const cover = images[0]
        return (
          <div className="relative mb-6 h-64 overflow-hidden rounded-[4px] border border-ink bg-coal">
            {cover ? (
              <Image
                src={cover.url}
                alt={property.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.06) 50%, transparent 51%)',
                  backgroundSize: '100% 16px',
                }}
              />
            )}
            {cover && (
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
            )}
            <div className="absolute left-4 top-4 font-mono text-[10px] tracking-wider text-paper">
              [ {property.external_id ?? property.id.slice(0, 8)} ]
            </div>
            <div className="absolute right-4 top-4 rounded-[4px] bg-signal px-2.5 py-1 font-mono text-[11px] font-medium tracking-wider text-paper">
              {t(`status.${property.status ?? 'draft'}`).toUpperCase()}
            </div>
            <div className="absolute bottom-4 right-4 text-right">
              <div className="font-mono text-[24px] font-medium tabular-nums text-paper">
                {property.price ? formatPrice(Number(property.price)) : '—'}
              </div>
              {property.ai_score && (
                <div className="font-mono text-[11px] uppercase tracking-wider text-signal">
                  SCORE {property.ai_score}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-wider text-paper">
                {images.length} IMG
              </div>
            )}
          </div>
        )
      })()}

      {/* Image gallery — remaining images */}
      {(() => {
        const images: StoredImage[] = Array.isArray(property.images)
          ? (property.images as unknown as StoredImage[])
          : []
        if (images.length <= 1) return null
        return (
          <div className="mb-6 grid grid-cols-3 gap-3 md:grid-cols-4">
            {images.slice(1).map((img) => (
              <div
                key={img.path}
                className="relative aspect-square overflow-hidden rounded-[4px] border border-bone"
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )
      })()}

      {/* Specs grid */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <SpecCell label="Tipo" value={t(`type.${property.property_type}`)} />
        <SpecCell
          label="Operación"
          value={t(`listingType.${property.listing_type}`)}
        />
        <SpecCell label="Dorm." value={property.bedrooms ?? '—'} />
        <SpecCell
          label="Baños"
          value={property.bathrooms ? Number(property.bathrooms) : '—'}
        />
        <SpecCell
          label="Área"
          value={property.area_m2 ? `${Number(property.area_m2)} m²` : '—'}
        />
        <SpecCell label="Moneda" value={property.currency ?? 'USD'} />
        <SpecCell
          label="Score IA"
          value={property.ai_score ?? '—'}
          accent={Boolean(property.ai_score)}
        />
        <SpecCell
          label="ID externo"
          value={property.external_id ?? '—'}
          mono
        />
      </div>

      {/* Description */}
      {property.description && (
        <div className="mb-6 rounded-[4px] border border-bone bg-paper p-5">
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Descripción
          </h3>
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
            {property.description}
          </p>
        </div>
      )}

      {/* Address */}
      {property.address && (
        <div className="mb-6 rounded-[4px] border border-bone bg-paper p-5">
          <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
            Dirección
          </h3>
          <p className="text-[13px] text-ink">{property.address}</p>
        </div>
      )}

      {/* Footer metadata */}
      <div className="grid grid-cols-2 gap-4 border-t border-bone pt-4 font-mono text-[11px] text-steel">
        <div>
          {t('createdAt')}: <span className="text-ink">{dateLong(property.created_at)}</span>
        </div>
        <div className="text-right">
          {t('updatedAt')}: <span className="text-ink">{dateLong(property.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function SpecCell({
  label,
  value,
  mono,
  accent,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  accent?: boolean
}) {
  return (
    <div className="rounded-[4px] border border-bone bg-paper p-3">
      <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
        {label}
      </p>
      <p
        className={`mt-1 ${
          mono ? 'font-mono' : 'font-sans'
        } text-[15px] tabular-nums ${accent ? 'text-signal' : 'text-ink'}`}
      >
        {value}
      </p>
    </div>
  )
}
