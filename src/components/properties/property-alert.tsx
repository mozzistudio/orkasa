import type { AlertTone } from '@/lib/properties/types'

const TONE_STYLES: Record<AlertTone, { bg: string; text: string; dot: string }> = {
  hot: { bg: 'bg-signal-bg', text: 'text-signal-deep', dot: 'bg-signal' },
  cool: { bg: 'bg-amber-bg', text: 'text-amber-text', dot: 'bg-amber-mark' },
  opp: { bg: 'bg-green-bg', text: 'text-green-text', dot: 'bg-green-mark' },
  neutral: { bg: 'bg-paper-warm', text: 'text-steel', dot: 'bg-steel-soft' },
}

export function PropertyAlert({
  tone,
  message,
}: {
  tone: AlertTone
  message: string
}) {
  const style = TONE_STYLES[tone]
  return (
    <div
      className={`mb-[10px] flex items-start gap-[7px] rounded-[5px] px-[10px] py-2 text-[11px] leading-[1.4] ${style.bg} ${style.text}`}
    >
      <span
        className={`mt-[5px] h-[6px] w-[6px] flex-shrink-0 rounded-full ${style.dot}`}
      />
      <span>{message}</span>
    </div>
  )
}
