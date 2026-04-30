import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

export function PropertyCard({
  id,
  fullId,
  title,
  location,
  price,
  leads,
  score,
  imageUrl,
}: {
  id: string
  /** Full UUID for /app/properties/{fullId} link. Falls back to short id if absent. */
  fullId?: string
  title: string
  location: string
  price: number
  leads: number
  score: number
  imageUrl?: string | null
}) {
  const href = `/app/properties/${fullId ?? id}`
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-[4px] border border-bone bg-paper transition-colors hover:border-ink"
    >
      <div className="relative h-32 bg-coal">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
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
        {/* Top gradient for legibility of overlaid chips */}
        {imageUrl && (
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-ink/60 to-transparent" />
        )}
        <div className="absolute left-3 top-3 font-mono text-[9px] tracking-wider text-paper">
          [ ID {id} ]
        </div>
        <div className="absolute right-3 top-3 rounded-[4px] bg-signal px-2 py-0.5 font-mono text-[10px] font-medium text-paper">
          FOR SALE
        </div>
      </div>
      <div className="p-3">
        <p className="text-[13px] font-medium text-ink">{title}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-steel">
          {location}
        </p>
        <div className="mt-2 flex items-baseline justify-between border-t border-bone pt-2">
          <span className="font-mono text-[15px] font-medium tabular-nums text-ink">
            {formatPrice(price)}
          </span>
          <span className="font-mono text-[10px] text-signal">
            SCORE {score}
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] text-steel">
          {leads} leads activos
        </p>
      </div>
    </Link>
  )
}
