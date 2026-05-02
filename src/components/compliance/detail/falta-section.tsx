import { TodoRow, type TodoItem } from './todo-row'

export function FaltaSection({
  items,
  clientName,
  clientPhone,
  propertyTitle,
  checkId,
}: {
  items: TodoItem[]
  clientName: string
  clientPhone: string | null
  propertyTitle: string
  checkId: string
}) {
  if (items.length === 0) return null

  return (
    <section className="rounded-[10px] border border-signal-soft bg-signal-bg overflow-hidden">
      <div className="border-b border-signal-deep/15 px-5 py-3.5">
        <div className="flex items-center gap-2 text-[14px] font-medium text-signal-deep">
          <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-signal text-white">
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 5v3.5M8 11v.5"/><circle cx="8" cy="8" r="6.5"/></svg>
          </span>
          Falta para poder firmar
        </div>
        <div className="mt-0.5 text-[11px] text-signal-deep/85">
          {items.length} {items.length === 1 ? 'cosa que tenés que resolver' : 'cosas que tenés que resolver'}
        </div>
      </div>

      <div className="bg-signal-bg">
        {items.map((item) => (
          <TodoRow
            key={item.id}
            item={item}
            clientName={clientName}
            clientPhone={clientPhone}
            propertyTitle={propertyTitle}
            checkId={checkId}
          />
        ))}
      </div>
    </section>
  )
}
