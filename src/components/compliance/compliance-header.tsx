export function ComplianceHeader({
  firstName,
  totalDeals,
  awaitingClient,
  awaitingBroker,
}: {
  firstName: string
  totalDeals: number
  awaitingClient: number
  awaitingBroker: number
}) {
  return (
    <div className="mb-7">
      <h1 className="mb-1 text-[24px] font-medium tracking-tight text-ink">
        Hola, {firstName} 👋
      </h1>
      <p className="text-[14px] leading-relaxed text-steel">
        Tenés{' '}
        <strong className="font-medium text-ink">
          {totalDeals} deals abiertos
        </strong>{' '}
        esta semana.{' '}
        {awaitingClient > 0 && (
          <>
            <span className="font-medium text-signal">
              {awaitingClient} esperan documentos del cliente
            </span>
            ,{' '}
          </>
        )}
        {awaitingBroker > 0 && (
          <>
            <strong className="font-medium text-ink">
              {awaitingBroker} esperan tu aprobación
            </strong>
            ,{' '}
          </>
        )}
        el resto avanza solo.
      </p>
    </div>
  )
}
