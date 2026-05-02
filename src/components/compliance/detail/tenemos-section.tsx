import { Check, ChevronDown } from 'lucide-react'
import { VerifiedDocRow, type VerifiedDoc } from './verified-doc-row'

export function TenemosSection({
  verifiedDocs,
  optionalDocsCount,
}: {
  verifiedDocs: VerifiedDoc[]
  optionalDocsCount: number
}) {
  return (
    <section className="rounded-[10px] border border-bone bg-paper overflow-hidden">
      <div className="border-b border-bone px-5 py-3.5">
        <div className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-green-bg text-green-text">
            <Check className="h-3 w-3" strokeWidth={2.5} />
          </span>
          Ya tenemos
        </div>
        <div className="mt-0.5 text-[11px] text-steel">
          {verifiedDocs.length === 0
            ? 'Todavía no hay documentos verificados'
            : `${verifiedDocs.length} ${verifiedDocs.length === 1 ? 'documento verificado' : 'documentos verificados'}`}
        </div>
      </div>

      {verifiedDocs.length > 0 && (
        <div>
          {verifiedDocs.map((doc) => (
            <VerifiedDocRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}

      {optionalDocsCount > 0 && (
        <div className="flex items-center justify-between border-t border-bone bg-paper-warm px-5 py-2.5 text-[12px] text-steel hover:bg-bone-soft cursor-pointer">
          <div>
            <strong className="font-medium text-ink">
              {optionalDocsCount} documentos opcionales
            </strong>{' '}
            según el caso (pasaporte, herencia, donación, autónomo…)
          </div>
          <ChevronDown
            className="h-3 w-3 text-steel-soft"
            strokeWidth={1.5}
          />
        </div>
      )}
    </section>
  )
}
