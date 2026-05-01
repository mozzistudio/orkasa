'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import Link from 'next/link'
import { Building2, Plus, Users, X } from 'lucide-react'

const SHOW_ON = ['/app/properties', '/app/leads', '/app/compliance', '/app/agents']

function shouldShow(pathname: string): boolean {
  return SHOW_ON.some((p) => pathname === p)
}

export function Fab() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY
      setVisible(y < lastScrollY.current || y < 10)
      lastScrollY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  if (!shouldShow(pathname)) return null

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-25 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed right-4 z-30 md:hidden transition-all duration-200 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
        style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {open && (
          <div className="mb-2 flex flex-col gap-1.5">
            <Link
              href="/app/properties/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[4px] border border-bone bg-paper px-4 py-3 text-[13px] font-medium text-ink active:bg-bone/30 transition-colors"
            >
              <Building2 className="h-4 w-4 text-steel" strokeWidth={1.5} />
              Nueva propiedad
            </Link>
            <Link
              href="/app/leads/new"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-[4px] border border-bone bg-paper px-4 py-3 text-[13px] font-medium text-ink active:bg-bone/30 transition-colors"
            >
              <Users className="h-4 w-4 text-steel" strokeWidth={1.5} />
              Nuevo lead
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`ml-auto flex h-14 w-14 items-center justify-center rounded-[4px] transition-colors ${
            open
              ? 'bg-ink text-paper active:bg-coal'
              : 'bg-signal text-paper active:bg-signal/80'
          }`}
        >
          {open ? (
            <X className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Plus className="h-6 w-6" strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  )
}
