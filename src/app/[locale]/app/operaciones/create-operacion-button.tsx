'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Plus, Search, X, UserPlus, Check, ChevronDown } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import {
  createDeal,
  getOperacionPickerData,
  createLeadInline,
} from '../deals/actions'

type LeadOption = {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  property_id: string | null
}

type PropertyOption = {
  id: string
  title: string
}

const STAGES = [
  { value: 'contacto_inicial', label: 'Contacto inicial' },
  { value: 'visitas', label: 'Visitas' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'promesa_firmada', label: 'Promesa firmada' },
] as const

export function CreateOperacionButton({
  leads: leadsProp,
  properties: propertiesProp,
  variant = 'default',
  label = 'Crear operación',
}: {
  leads?: LeadOption[]
  properties?: PropertyOption[]
  variant?: 'default' | 'primary'
  label?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [leadSearch, setLeadSearch] = useState('')
  const [propSearch, setPropSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null)
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyOption | null>(null)
  const [stage, setStage] = useState<string>('contacto_inicial')
  const [amount, setAmount] = useState('')

  // Combobox open states
  const [leadOpen, setLeadOpen] = useState(false)
  const [propOpen, setPropOpen] = useState(false)
  const leadRef = useRef<HTMLDivElement | null>(null)
  const propRef = useRef<HTMLDivElement | null>(null)

  // Inline lead creation
  const [creatingLead, setCreatingLead] = useState(false)
  const [newLeadPhone, setNewLeadPhone] = useState('')
  const [newLeadEmail, setNewLeadEmail] = useState('')
  const [creatingPending, setCreatingPending] = useState(false)

  // Close popovers on outside click
  useEffect(() => {
    if (!leadOpen && !propOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (leadOpen && leadRef.current && !leadRef.current.contains(target)) {
        setLeadOpen(false)
      }
      if (propOpen && propRef.current && !propRef.current.contains(target)) {
        setPropOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [leadOpen, propOpen])

  const [leads, setLeads] = useState<LeadOption[]>(leadsProp ?? [])
  const [properties, setProperties] = useState<PropertyOption[]>(
    propertiesProp ?? [],
  )
  const [loadingOptions, setLoadingOptions] = useState(false)
  const hasFetchedOptions =
    leadsProp !== undefined || propertiesProp !== undefined

  useEffect(() => {
    if (!open) return
    if (hasFetchedOptions) return
    if (leads.length > 0 || properties.length > 0) return
    setLoadingOptions(true)
    getOperacionPickerData()
      .then((data) => {
        setLeads(data.leads)
        setProperties(data.properties)
      })
      .finally(() => setLoadingOptions(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleSelectLead(lead: LeadOption) {
    setSelectedLead(lead)
    setLeadSearch('')
    setLeadOpen(false)
    if (!selectedProperty && lead.property_id) {
      const prop = properties.find((p) => p.id === lead.property_id)
      if (prop) setSelectedProperty(prop)
    }
  }

  function handleSelectProperty(prop: PropertyOption) {
    setSelectedProperty(prop)
    setPropSearch('')
    setPropOpen(false)
  }

  function clearLead() {
    setSelectedLead(null)
    setLeadSearch('')
    setCreatingLead(false)
  }

  function clearProperty() {
    setSelectedProperty(null)
    setPropSearch('')
  }

  function reset() {
    clearLead()
    clearProperty()
    setStage('contacto_inicial')
    setAmount('')
    setError(null)
    setNewLeadPhone('')
    setNewLeadEmail('')
    setCreatingLead(false)
  }

  async function handleCreateLeadInline() {
    setError(null)
    const name = leadSearch.trim()
    if (!name) {
      setError('Nombre del lead requerido')
      return
    }
    setCreatingPending(true)
    const result = await createLeadInline({
      full_name: name,
      phone: newLeadPhone || null,
      email: newLeadEmail || null,
    })
    setCreatingPending(false)
    if (result.error) {
      setError(result.error)
      return
    }
    if (result.id && result.full_name) {
      const lead: LeadOption = {
        id: result.id,
        full_name: result.full_name,
        phone: result.phone ?? null,
        email: result.email ?? null,
        property_id: null,
      }
      setLeads((ls) => [lead, ...ls])
      setSelectedLead(lead)
      setLeadSearch('')
      setCreatingLead(false)
      setNewLeadPhone('')
      setNewLeadEmail('')
    }
  }

  function handleSubmit() {
    setError(null)
    if (!selectedLead) {
      setError('Tenés que seleccionar un cliente')
      return
    }
    const fd = new FormData()
    fd.set('lead_id', selectedLead.id)
    if (selectedProperty) fd.set('property_id', selectedProperty.id)
    fd.set('stage', stage)
    if (amount) fd.set('amount', amount)
    fd.set('currency', 'USD')
    fd.set('redirect_to_detail', '1')

    startTransition(async () => {
      const result = await createDeal(fd)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.id) {
        setOpen(false)
        reset()
        router.push(`/app/operaciones/${result.id}`)
      }
    })
  }

  const filteredLeads = leadSearch
    ? leads
        .filter((l) =>
          [l.full_name, l.phone ?? '', l.email ?? '']
            .join(' ')
            .toLowerCase()
            .includes(leadSearch.toLowerCase()),
        )
        .slice(0, 8)
    : leads.slice(0, 8)

  const filteredProps = propSearch
    ? properties
        .filter((p) =>
          p.title.toLowerCase().includes(propSearch.toLowerCase()),
        )
        .slice(0, 8)
    : properties.slice(0, 8)

  const buttonClass =
    variant === 'primary'
      ? 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[4px] bg-ink text-paper text-[13px] font-medium hover:bg-coal transition-colors'
      : 'inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-ink text-paper text-[13px] font-medium hover:bg-coal transition-colors'

  function close() {
    if (pending || creatingPending) return
    setOpen(false)
    reset()
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const modal = open ? (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            onClick={close}
          />

          <div className="relative z-10 flex w-full max-w-[520px] max-h-[calc(100vh-3rem)] flex-col rounded-t-[4px] md:rounded-[4px] border border-ink/10 bg-paper">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-bone px-5 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                  Nueva
                </p>
                <h2 className="text-[16px] font-medium tracking-[-0.3px] text-ink">
                  Operación
                </h2>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-steel hover:bg-bone-soft hover:text-ink transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Cliente */}
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    Cliente
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-signal">
                    Requerido
                  </span>
                </div>

                {selectedLead ? (
                  <div className="flex items-center justify-between rounded-[4px] border border-ink bg-paper px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-ink truncate">
                        {selectedLead.full_name}
                      </p>
                      {(selectedLead.phone || selectedLead.email) && (
                        <p className="font-mono text-[11px] text-steel truncate">
                          {selectedLead.phone ?? selectedLead.email}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearLead}
                      className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-steel hover:bg-bone hover:text-ink transition-colors"
                      aria-label="Quitar cliente"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : creatingLead ? null : (
                  <div ref={leadRef} className="relative">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
                        strokeWidth={1.5}
                      />
                      <input
                        type="text"
                        value={leadSearch}
                        onChange={(e) => {
                          setLeadSearch(e.target.value)
                          setLeadOpen(true)
                        }}
                        onFocus={() => setLeadOpen(true)}
                        placeholder={
                          loadingOptions
                            ? 'Cargando…'
                            : 'Buscar o seleccionar cliente…'
                        }
                        disabled={loadingOptions}
                        className="h-10 w-full rounded-[4px] border border-bone bg-paper pl-9 pr-9 text-[13px] focus:border-ink focus:outline-none focus:ring-0 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setLeadOpen((o) => !o)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-[4px] text-steel hover:bg-bone-soft hover:text-ink transition-colors"
                        aria-label="Abrir lista"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            leadOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>

                    {leadOpen && (
                      <div className="mt-1.5 rounded-[4px] border border-ink/15 bg-paper overflow-hidden">
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-bone-soft">
                          {filteredLeads.length === 0 ? (
                            <p className="px-3 py-3 font-mono text-[11px] uppercase tracking-[1.2px] text-steel-soft">
                              {leadSearch
                                ? 'Sin coincidencias'
                                : 'Sin clientes cargados'}
                            </p>
                          ) : (
                            filteredLeads.map((lead) => (
                              <button
                                key={lead.id}
                                type="button"
                                onClick={() => handleSelectLead(lead)}
                                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-bone-soft transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-medium text-ink truncate">
                                    {lead.full_name}
                                  </p>
                                  {(lead.phone || lead.email) && (
                                    <p className="font-mono text-[11px] text-steel truncate">
                                      {lead.phone ?? lead.email}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCreatingLead(true)
                            setLeadOpen(false)
                          }}
                          className="flex w-full items-center gap-2 border-t border-bone bg-bone-soft/40 px-3 py-2.5 text-left hover:bg-bone-soft transition-colors"
                        >
                          <UserPlus
                            className="h-3.5 w-3.5 shrink-0 text-ink"
                            strokeWidth={1.5}
                          />
                          <span className="text-[12px] font-medium text-ink">
                            Crear nuevo cliente
                            {leadSearch ? `: ${leadSearch}` : ''}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {creatingLead && (
                      <div className="mt-2 rounded-[4px] border border-ink/15 bg-bone-soft/50 p-3 space-y-2">
                        <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
                          Nuevo lead
                        </p>
                        <input
                          type="text"
                          value={leadSearch}
                          onChange={(e) => setLeadSearch(e.target.value)}
                          placeholder="Nombre completo"
                          className="h-9 w-full rounded-[4px] border border-bone bg-paper px-2.5 text-[13px] focus:border-ink focus:outline-none"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="tel"
                            value={newLeadPhone}
                            onChange={(e) => setNewLeadPhone(e.target.value)}
                            placeholder="+507 6000-0000"
                            className="h-9 w-full rounded-[4px] border border-bone bg-paper px-2.5 font-mono text-[12px] focus:border-ink focus:outline-none"
                          />
                          <input
                            type="email"
                            value={newLeadEmail}
                            onChange={(e) => setNewLeadEmail(e.target.value)}
                            placeholder="email@ejemplo.com"
                            className="h-9 w-full rounded-[4px] border border-bone bg-paper px-2.5 font-mono text-[12px] focus:border-ink focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCreatingLead(false)
                              setNewLeadPhone('')
                              setNewLeadEmail('')
                            }}
                            disabled={creatingPending}
                            className="px-2.5 py-1.5 text-[12px] text-steel hover:text-ink transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateLeadInline}
                            disabled={creatingPending || !leadSearch.trim()}
                            className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-3 py-1.5 text-[12px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3 w-3" strokeWidth={2} />
                            {creatingPending ? 'Creando…' : 'Crear y usar'}
                          </button>
                        </div>
                      </div>
                    )}
              </section>

              {/* Propiedad */}
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    Propiedad
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel-soft">
                    Opcional
                  </span>
                </div>

                {selectedProperty ? (
                  <div className="flex items-center justify-between rounded-[4px] border border-ink bg-paper px-3 py-2.5">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {selectedProperty.title}
                    </p>
                    <button
                      type="button"
                      onClick={clearProperty}
                      className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-steel hover:bg-bone hover:text-ink transition-colors"
                      aria-label="Quitar propiedad"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div ref={propRef} className="relative">
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
                        strokeWidth={1.5}
                      />
                      <input
                        type="text"
                        value={propSearch}
                        onChange={(e) => {
                          setPropSearch(e.target.value)
                          setPropOpen(true)
                        }}
                        onFocus={() => setPropOpen(true)}
                        placeholder="Buscar o seleccionar propiedad…"
                        className="h-10 w-full rounded-[4px] border border-bone bg-paper pl-9 pr-9 text-[13px] focus:border-ink focus:outline-none focus:ring-0"
                      />
                      <button
                        type="button"
                        onClick={() => setPropOpen((o) => !o)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-[4px] text-steel hover:bg-bone-soft hover:text-ink transition-colors"
                        aria-label="Abrir lista"
                      >
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            propOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>

                    {propOpen && (
                      <div className="mt-1.5 rounded-[4px] border border-ink/15 bg-paper overflow-hidden">
                        <div className="max-h-[180px] overflow-y-auto divide-y divide-bone-soft">
                          {filteredProps.length === 0 ? (
                            <p className="px-3 py-3 font-mono text-[11px] uppercase tracking-[1.2px] text-steel-soft">
                              {propSearch
                                ? 'Sin coincidencias'
                                : 'Sin propiedades cargadas'}
                            </p>
                          ) : (
                            filteredProps.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectProperty(p)}
                                className="w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-bone-soft transition-colors truncate"
                              >
                                {p.title}
                              </button>
                            ))
                          )}
                        </div>
                        <Link
                          href="/app/properties/new"
                          onClick={() => setPropOpen(false)}
                          className="flex w-full items-center gap-2 border-t border-bone bg-bone-soft/40 px-3 py-2.5 hover:bg-bone-soft transition-colors"
                        >
                          <Plus
                            className="h-3.5 w-3.5 shrink-0 text-ink"
                            strokeWidth={1.5}
                          />
                          <span className="text-[12px] font-medium text-ink">
                            Cargar propiedad nueva
                          </span>
                        </Link>
                      </div>
                    )}

                    <p className="mt-1.5 text-[10px] text-steel-soft">
                      Podés agregar más propiedades después desde la operación.
                    </p>
                  </div>
                )}
              </section>

              {/* Stage + monto */}
              <section className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    Stage inicial
                  </p>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] text-ink focus:border-ink focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                      Monto
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel-soft">
                      Opcional
                    </span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="450000"
                    className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 font-mono tabular-nums text-[13px] focus:border-ink focus:outline-none focus:ring-0"
                  />
                </div>
              </section>

              {error && (
                <p className="rounded-[4px] border border-signal/40 bg-signal-bg px-3 py-2 font-mono text-[11px] text-signal-deep">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-bone px-5 py-3">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="px-3 py-2 text-[12px] text-steel hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending || !selectedLead}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? 'Creando…' : 'Crear operación'}
              </button>
            </div>
          </div>
        </div>
  ) : null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
        {label}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  )
}
