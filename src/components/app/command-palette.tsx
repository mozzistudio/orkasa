'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Users,
  LayoutDashboard,
  Plus,
  Search,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { createClient } from '@/lib/supabase/client'

type Hit = {
  kind: 'property' | 'lead'
  id: string
  primary: string
  secondary: string
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // ⌘K / Ctrl+K to toggle
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Debounced search across properties + leads
  useEffect(() => {
    if (!open) return
    if (query.trim().length < 2) {
      setHits([])
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const supabase = createClient()
        const escaped = query.trim().replace(/[%_]/g, '\\$&')
        const [propsRes, leadsRes] = await Promise.all([
          supabase
            .from('properties')
            .select('id, title, neighborhood, city')
            .or(
              [
                `title.ilike.%${escaped}%`,
                `neighborhood.ilike.%${escaped}%`,
                `external_id.ilike.%${escaped}%`,
              ].join(','),
            )
            .limit(5)
            .returns<
              Array<{
                id: string
                title: string
                neighborhood: string | null
                city: string | null
              }>
            >(),
          supabase
            .from('leads')
            .select('id, full_name, email, phone')
            .or(
              [
                `full_name.ilike.%${escaped}%`,
                `email.ilike.%${escaped}%`,
                `phone.ilike.%${escaped}%`,
              ].join(','),
            )
            .limit(5)
            .returns<
              Array<{
                id: string
                full_name: string
                email: string | null
                phone: string | null
              }>
            >(),
        ])

        const next: Hit[] = []
        for (const p of propsRes.data ?? []) {
          next.push({
            kind: 'property',
            id: p.id,
            primary: p.title,
            secondary: [p.neighborhood, p.city].filter(Boolean).join(' · '),
          })
        }
        for (const l of leadsRes.data ?? []) {
          next.push({
            kind: 'lead',
            id: l.id,
            primary: l.full_name,
            secondary: l.email ?? l.phone ?? '',
          })
        }
        setHits(next)
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [query, open])

  function go(href: string) {
    setOpen(false)
    setQuery('')
    setHits([])
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Buscar propiedades, leads, o ir a…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {pending
            ? 'Buscando…'
            : query.length < 2
              ? 'Escribí al menos 2 caracteres.'
              : 'Sin resultados.'}
        </CommandEmpty>

        {hits.filter((h) => h.kind === 'property').length > 0 && (
          <CommandGroup heading="Propiedades">
            {hits
              .filter((h) => h.kind === 'property')
              .map((h) => (
                <CommandItem
                  key={`p-${h.id}`}
                  onSelect={() => go(`/app/properties/${h.id}`)}
                  value={`property ${h.primary} ${h.secondary}`}
                >
                  <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  <span>{h.primary}</span>
                  {h.secondary && (
                    <span className="ml-auto font-mono text-[11px] text-steel">
                      {h.secondary}
                    </span>
                  )}
                </CommandItem>
              ))}
          </CommandGroup>
        )}

        {hits.filter((h) => h.kind === 'lead').length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Leads">
              {hits
                .filter((h) => h.kind === 'lead')
                .map((h) => (
                  <CommandItem
                    key={`l-${h.id}`}
                    onSelect={() => go(`/app/leads/${h.id}`)}
                    value={`lead ${h.primary} ${h.secondary}`}
                  >
                    <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span>{h.primary}</span>
                    {h.secondary && (
                      <span className="ml-auto font-mono text-[11px] text-steel">
                        {h.secondary}
                      </span>
                    )}
                  </CommandItem>
                ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => go('/app')}>
            <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ir a Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go('/app/properties')}>
            <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ir a Inventario
          </CommandItem>
          <CommandItem onSelect={() => go('/app/leads')}>
            <Users className="h-3.5 w-3.5" strokeWidth={1.5} />
            Ir a Leads
          </CommandItem>
          <CommandItem onSelect={() => go('/app/properties/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Nueva propiedad
          </CommandItem>
          <CommandItem onSelect={() => go('/app/leads/new')}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Nuevo lead
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function CommandPaletteTrigger() {
  // Manually open the palette via keyboard event dispatch
  function open() {
    const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    window.dispatchEvent(e)
  }
  return (
    <button
      onClick={open}
      type="button"
      className="relative inline-flex h-9 w-64 items-center gap-2 rounded-[4px] border border-bone bg-paper pl-3 pr-2 font-mono text-[12px] text-steel hover:border-ink transition-colors"
    >
      <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
      <span className="text-[13px]">Buscar...</span>
      <span className="ml-auto rounded-[3px] border border-bone bg-bone/50 px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-steel">
        ⌘K
      </span>
    </button>
  )
}
