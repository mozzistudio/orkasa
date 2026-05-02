import { Check, Eye, Download } from 'lucide-react'

export type VerifiedDoc = {
  id: string
  humanName: string
  detail: string
}

export function VerifiedDocRow({ doc }: { doc: VerifiedDoc }) {
  return (
    <div className="grid grid-cols-[18px_1fr_auto] items-center gap-3 border-b border-bone px-5 py-3 last:border-b-0 transition-colors hover:bg-paper-warm">
      {/* Status icon */}
      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-mark text-white">
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="text-[12.5px] font-medium leading-tight text-ink">
          {doc.humanName}
        </div>
        <div
          className="mt-0.5 text-[11px] leading-relaxed text-steel"
          dangerouslySetInnerHTML={{ __html: doc.detail }}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          title="Ver documento"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-bone bg-paper-warm text-steel hover:bg-paper hover:text-ink"
        >
          <Eye className="h-3 w-3" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          title="Descargar"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-[4px] border border-bone bg-paper-warm text-steel hover:bg-paper hover:text-ink"
        >
          <Download className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
