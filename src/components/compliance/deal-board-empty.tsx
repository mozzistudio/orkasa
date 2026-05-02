import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react'

const CONFIG = {
  blocked: { Icon: ShieldCheck, className: 'text-signal' },
  progressing: { Icon: Clock, className: 'text-steel' },
  ready: { Icon: CheckCircle2, className: 'text-[#2E7D52]' },
} as const

export function DealBoardEmpty({
  column,
  message,
}: {
  column: 'blocked' | 'progressing' | 'ready'
  message: string
}) {
  const { Icon, className } = CONFIG[column]

  return (
    <div className="flex flex-col items-center gap-2 rounded-[8px] border border-dashed border-bone px-4 py-8 text-center">
      <Icon className={`h-5 w-5 ${className}`} />
      <p className="text-[12px] text-steel">{message}</p>
    </div>
  )
}
