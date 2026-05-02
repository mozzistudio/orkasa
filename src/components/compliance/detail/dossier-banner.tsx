import { Check, AlertTriangle } from 'lucide-react'
import { formatRelativeEs } from '@/lib/compliance-copy'
import { ApproveDealButton } from './approve-deal-button'
import { FlaggedActionsButtons } from './flagged-actions-buttons'

export function DossierBanner({
  state,
  checkId,
  dealValue,
  reviewerName,
  reviewedAt,
  flagReason,
}: {
  state: 'ready' | 'flagged'
  checkId: string
  dealValue: number
  reviewerName: string | null
  reviewedAt: string | null
  flagReason: string | null
}) {
  if (state === 'ready') {
    return (
      <section className="rounded-[10px] border border-green-mark/20 bg-green-bg px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-mark text-white">
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-green-text">
                Todo listo · podés aprobar y firmar
              </div>
              <div className="mt-0.5 text-[12px] text-green-text/80">
                Documentación completa, sin alertas.
                {reviewerName && reviewedAt && (
                  <>
                    {' '}
                    Verificado por <strong className="font-medium">{reviewerName}</strong>{' '}
                    {formatRelativeEs(reviewedAt)}.
                  </>
                )}
              </div>
            </div>
          </div>
          <ApproveDealButton
            checkId={checkId}
            dealValue={dealValue}
            requireJustification={dealValue > 300_000}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-[10px] border border-amber-mark/30 bg-amber-bg px-5 py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-mark text-white">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-medium text-amber-text">
              Listo, pero requiere revisión adicional
            </div>
            <div className="mt-0.5 text-[12px] text-amber-text/85">
              {flagReason ?? 'Hay un punto a confirmar antes de poder aprobar.'}
            </div>
          </div>
        </div>
        <FlaggedActionsButtons checkId={checkId} dealValue={dealValue} />
      </div>
    </section>
  )
}
