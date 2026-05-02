import { Suspense } from 'react'
import { Link } from '@/i18n/navigation'
import { Plus, Upload } from 'lucide-react'
import {
  getActiveProperties,
  getArchivedProperties,
  getDraftProperties,
  getPortfolioSnapshot,
  getPropertyCounts,
  type ListingFilter,
  type OwnerFilter,
} from '@/lib/queries/properties'
import { PortfolioStatsGrid } from '@/components/properties/portfolio-stats-grid'
import { PropertiesControls } from '@/components/properties/properties-controls'
import { PropertyCard } from '@/components/properties/property-card'
import { DraftRow } from '@/components/properties/draft-row'
import { ArchiveFold } from '@/components/properties/archive-fold'

const KNOWN_LISTING: readonly string[] = ['all', 'sale', 'rent']
const KNOWN_OWNER: readonly string[] = ['all', 'mine', 'team']
const KNOWN_VIEW: readonly string[] = ['cards', 'table']

function SectionHeader({
  emoji,
  title,
  count,
  meta,
}: {
  emoji: string
  title: string
  count?: string
  meta?: React.ReactNode
}) {
  return (
    <div className="mb-3 mt-7 flex items-baseline justify-between">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[1.4px] text-steel">
        <span className="text-[13px]">{emoji}</span>
        <span>{title}</span>
        {count && <span className="font-medium text-ink">· {count}</span>}
      </div>
      {meta && (
        <div className="font-mono text-[11px] text-steel">{meta}</div>
      )}
    </div>
  )
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string
    listing?: string
    owner?: string
    view?: string
  }>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const listing: ListingFilter = (
    KNOWN_LISTING.includes(params.listing ?? '')
      ? params.listing
      : 'all'
  ) as ListingFilter
  const owner: OwnerFilter = (
    KNOWN_OWNER.includes(params.owner ?? '') ? params.owner : 'all'
  ) as OwnerFilter
  const view = (
    KNOWN_VIEW.includes(params.view ?? '') ? params.view : 'cards'
  ) as 'cards' | 'table'

  const [snapshot, counts, active, drafts, archived] = await Promise.all([
    getPortfolioSnapshot(),
    getPropertyCounts(),
    getActiveProperties({ q, listing, owner }),
    getDraftProperties(),
    getArchivedProperties(20),
  ])

  // Empty brokerage
  if (
    snapshot &&
    snapshot.activeCount === 0 &&
    drafts.length === 0 &&
    archived.length === 0
  ) {
    return (
      <div className="max-w-[1380px]">
        <PageHeader
          activeCount={0}
          attentionCount={0}
          draftCount={0}
        />
        <div className="rounded-[10px] border border-dashed border-bone bg-paper-warm p-12 text-center">
          <p className="mb-4 text-[14px] text-steel">
            Tu brokerage está vacío. Empezá creando una propiedad o importando desde un portal.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/app/properties/new"
              className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Nueva propiedad
            </Link>
            <button
              type="button"
              disabled
              className="inline-flex items-center gap-2 rounded-[4px] border border-bone bg-paper px-4 py-2 text-[13px] font-medium text-steel opacity-60 cursor-not-allowed"
              title="Próximamente"
            >
              <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              Importar de portal
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1380px]">
      <PageHeader
        activeCount={snapshot?.activeCount ?? 0}
        attentionCount={snapshot?.needsAttentionCount ?? 0}
        draftCount={drafts.length}
      />

      {snapshot && <PortfolioStatsGrid data={snapshot} />}

      <PropertiesControls
        basePath="/app/properties"
        counts={{ listing: counts.byListing, owner: counts.byOwner }}
        q={q}
        listing={listing}
        owner={owner}
        view={view}
      />

      {/* ACTIVAS */}
      <SectionHeader
        emoji="🟢"
        title="Activas"
        count={`${active.length} propiedad${active.length === 1 ? '' : 'es'}`}
        meta={
          active.length > 1 ? (
            <>
              ordenadas por <span className="text-ink">actividad reciente</span>
            </>
          ) : null
        }
      />

      {active.length === 0 ? (
        <div className="rounded-[10px] border border-dashed border-bone bg-paper-warm p-8 text-center text-[13px] text-steel">
          {q || listing !== 'all' || owner !== 'all'
            ? 'No encontramos propiedades con esos filtros.'
            : 'No tenés propiedades publicadas todavía. Completá tus borradores para empezar a recibir leads.'}
        </div>
      ) : (
        <Suspense fallback={null}>
          <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 lg:grid-cols-3">
            {active.map((p, i) => (
              <PropertyCard key={p.id} property={p} fallbackIndex={i} />
            ))}
          </div>
        </Suspense>
      )}

      {/* EN PROCESO */}
      {drafts.length > 0 && (
        <>
          <SectionHeader
            emoji="📝"
            title="En proceso"
            count={`${drafts.length} borrador${drafts.length === 1 ? '' : 'es'}`}
            meta="completá para publicar"
          />
          <div className="overflow-hidden rounded-[10px] border border-bone bg-paper">
            {drafts.map((d, i) => (
              <DraftRow key={d.id} draft={d} fallbackIndex={i} />
            ))}
          </div>
        </>
      )}

      {/* ARCHIVO */}
      {archived.length > 0 && (
        <>
          <SectionHeader
            emoji="📦"
            title="Archivo"
            count={`${archived.length} propiedad${archived.length === 1 ? '' : 'es'}`}
          />
          <ArchiveFold items={archived} />
        </>
      )}
    </div>
  )
}

function PageHeader({
  activeCount,
  attentionCount,
  draftCount,
}: {
  activeCount: number
  attentionCount: number
  draftCount: number
}) {
  return (
    <div className="mb-[22px] flex items-end justify-between gap-6">
      <div className="min-w-0">
        <div className="mb-[6px] font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
          Inventario
        </div>
        <h1 className="mb-[6px] text-[24px] font-medium tracking-[-0.5px] text-ink">
          Propiedades
        </h1>
        <p className="text-[14px] leading-[1.5] text-steel">
          {activeCount > 0 && (
            <>
              <strong className="font-medium text-ink">
                {activeCount} activa{activeCount === 1 ? '' : 's'}
              </strong>{' '}
              {activeCount === 1 ? 'genera' : 'generan'} tracción esta semana
              {attentionCount > 0 && ', '}
            </>
          )}
          {attentionCount > 0 && (
            <>
              <span className="font-medium text-signal-deep">
                {attentionCount} {attentionCount === 1 ? 'necesita' : 'necesitan'}{' '}
                atención
              </span>
              {draftCount > 0 && ', '}
            </>
          )}
          {draftCount > 0 && (
            <>
              <strong className="font-medium text-ink">
                {draftCount} borrador{draftCount === 1 ? '' : 'es'}
              </strong>{' '}
              {draftCount === 1 ? 'espera' : 'esperan'} que {draftCount === 1 ? 'lo' : 'los'} completes
            </>
          )}
          {!activeCount && !attentionCount && !draftCount && 'Sin actividad reciente.'}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex items-center gap-[6px] rounded-[4px] border border-bone bg-paper px-3 py-[7px] text-[12px] font-medium text-steel opacity-60 cursor-not-allowed"
          title="Próximamente"
        >
          <Upload className="h-3 w-3" strokeWidth={1.5} />
          Importar
        </button>
        <Link
          href="/app/properties/new"
          className="inline-flex items-center gap-[6px] rounded-[4px] bg-ink px-[14px] py-[7px] text-[12px] font-medium text-paper transition-colors hover:bg-coal"
        >
          <Plus className="h-3 w-3" strokeWidth={1.5} />
          Nueva propiedad
        </Link>
      </div>
    </div>
  )
}
