import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { formatPriceCompact } from '@/lib/utils'

type StoredImage = { path: string; url: string }

type Props = {
  propertyId: string
  title: string
  neighborhood: string | null
  city: string | null
  price: number | null
  listingType: 'sale' | 'rent' | null
  bedrooms: number | null
  bathrooms: number | null
  areaM2: number | null
  images: unknown
}

function coverUrl(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const first = images[0] as StoredImage | undefined
  return first?.url ?? null
}

export function RelatedPropertyCard({
  propertyId,
  title,
  neighborhood,
  city,
  price,
  listingType,
  bedrooms,
  bathrooms,
  areaM2,
  images,
}: Props) {
  const cover = coverUrl(images)
  const location = [neighborhood, city].filter(Boolean).join(' · ')
  const priceLabel =
    price != null
      ? listingType === 'rent'
        ? `${formatPriceCompact(price)}/mes`
        : formatPriceCompact(price)
      : '—'

  const specs = [
    bedrooms != null && `${bedrooms} dorm`,
    bathrooms != null && `${Number(bathrooms)} baños`,
    areaM2 != null && `${Number(areaM2)} m²`,
  ].filter(Boolean) as string[]

  return (
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      <div className="flex items-center justify-between px-[18px] pt-3.5 pb-2.5">
        <div className="font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
          Propiedad asociada
        </div>
        <Link
          href={`/app/properties/${propertyId}`}
          className="text-[11px] text-steel hover:text-ink"
        >
          Ver ficha →
        </Link>
      </div>

      <Link
        href={`/app/properties/${propertyId}`}
        className="block px-[18px] pb-4 hover:bg-paper-warm transition-colors"
      >
        <div className="flex gap-3">
          <div className="relative h-[60px] w-[80px] flex-shrink-0 overflow-hidden rounded-[6px] border border-bone bg-coal">
            {cover ? (
              <Image
                src={cover}
                alt={title}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#5D7A8C] to-[#2E4A5C]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-ink truncate">
              {title}
            </div>
            {location && (
              <div className="mt-0.5 text-[11px] text-steel truncate">
                {location}
              </div>
            )}
            <div className="mt-1 font-mono text-[12px] text-ink">
              {priceLabel}
            </div>
          </div>
        </div>
        {specs.length > 0 && (
          <div className="mt-2.5 border-t border-bone-soft pt-2.5 text-[11px] text-steel">
            {specs.join(' · ')}
          </div>
        )}
      </Link>
    </section>
  )
}
