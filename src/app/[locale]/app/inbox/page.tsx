import { Inbox } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { InboxList } from './inbox-list'

type NotificationRow = {
  id: string
  type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  created_at: string
}

export default async function InboxPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<NotificationRow[]>()

  const all = notifications ?? []
  const unread = all.filter((n) => !n.is_read)
  const read = all.filter((n) => n.is_read)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between md:mb-6">
        <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
          Bandeja
          <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
            {all.length}
          </span>
        </h1>
      </div>

      {all.length === 0 ? (
        <div className="rounded-[4px] border border-bone bg-paper p-8 text-center md:p-12">
          <Inbox
            className="mx-auto mb-3 h-6 w-6 text-steel"
            strokeWidth={1.5}
          />
          <p className="text-[13px] text-steel">
            Sin notificaciones. Te avisaremos aquí cuando algo necesite tu
            atención.
          </p>
        </div>
      ) : (
        <InboxList unread={unread} read={read} />
      )}
    </div>
  )
}
