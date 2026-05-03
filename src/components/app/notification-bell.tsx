'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [agentId, setAgentId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      setAgentId(user.id)

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', user.id)
        .eq('is_read', false)

      if (!cancelled) setUnreadCount(count ?? 0)
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!agentId) return
    const supabase = createClient()

    const channel = supabase
      .channel(`notifications:${agentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `agent_id=eq.${agentId}`,
        },
        () => {
          setUnreadCount((c) => c + 1)
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `agent_id=eq.${agentId}`,
        },
        async () => {
          const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('agent_id', agentId)
            .eq('is_read', false)
          setUnreadCount(count ?? 0)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agentId])

  return (
    <Link
      href="/app/inbox"
      className="relative flex h-10 w-10 items-center justify-center rounded-[4px] text-steel hover:text-ink active:bg-bone/30 transition-colors"
      aria-label={
        unreadCount > 0
          ? `Notificaciones (${unreadCount} sin leer)`
          : 'Notificaciones'
      }
    >
      <Bell className="h-5 w-5" strokeWidth={1.5} />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] h-[16px] items-center justify-center rounded-full bg-signal px-1 font-mono text-[9px] font-medium tabular-nums text-paper">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
