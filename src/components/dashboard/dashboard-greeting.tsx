import { getGreeting, getGreetingEmoji, buildPulsePhrase } from '@/lib/dashboard-copy'

export function DashboardGreeting({
  firstName,
  totalValue,
  readyToSign,
  coolingCount,
}: {
  firstName: string
  totalValue: number
  readyToSign: number
  coolingCount: number
}) {
  const greeting = getGreeting(firstName)
  const emoji = getGreetingEmoji()
  const pulse = buildPulsePhrase({ totalValue, readyToSign, coolingCount })

  return (
    <div className="mb-6">
      <h1 className="text-[24px] font-medium tracking-[-0.5px] text-ink">
        {greeting} {emoji}
      </h1>
      <p className="mt-1 text-[14px] leading-relaxed text-steel">
        {pulse.prefix}
        {pulse.ready && (
          <>
            {' '}
            <span className="font-medium text-green-text">{pulse.ready}</span>
          </>
        )}
        {pulse.ready && pulse.urgent && ','}
        {pulse.urgent && (
          <>
            {' '}
            <span className="font-medium text-signal-deep">{pulse.urgent}</span>
          </>
        )}
        {(pulse.ready || pulse.urgent) && '.'}
      </p>
    </div>
  )
}
