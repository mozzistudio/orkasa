'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, X } from 'lucide-react'
import { createDeal, getOperacionPickerData } from '../deals/actions'

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
  /** Optional pre-fetched options. When omitted, the modal lazy-loads
   *  them from the server the first time it opens — useful when the
   *  button lives in the topbar / shared layout. */
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
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [stage, setStage] = useState<string>('contacto_inicial')
  const [amount, setAmount] = useState('')
  const [currency] = useState('USD')

  const [leads, setLeads] = useState<LeadOption[]>(leadsProp ?? [])
  const [properties, setProperties] = useState<PropertyOption[]>(
    propertiesProp ?? [],
  )
  const [loadingOptions, setLoadingOptions] = useState(false)
  const hasFetchedOptions = leadsProp !== undefined || propertiesProp !== undefined

  // Lazy-fetch picker data on first open when not provided as props
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
    setSelectedLeadId(lead.id)
    setLeadSearch(lead.full_name)
    if (!selectedPropertyId && lead.property_id) {
      setSelectedPropertyId(lead.property_id)
      const prop = properties.find((p) => p.id === lead.property_id)
      if (prop) setPropSearch(prop.title)
    }
  }

  function reset() {
    setSelectedLeadId(null)
    setSelectedPropertyId(null)
    setLeadSearch('')
    setPropSearch('')
    setStage('contacto_inicial')
    setAmount('')
    setError(null)
  }

  function handleSubmit() {
    setError(null)
    if (!selectedLeadId) {
      setError('Tenés que seleccionar un cliente')
      return
    }
    const fd = new FormData()
    fd.set('lead_id', selectedLeadId)
    if (selectedPropertyId) fd.set('property_id', selectedPropertyId)
    fd.set('stage', stage)
    if (amount) fd.set('amount', amount)
    fd.set('currency', currency)
    fd.set('redirect_to_detail', '1')

    startTransition(async () => {
      const result = await createDeal(fd)
      if (result.error) {
        setError(result.error)
        return
      }
      // createDeal redirects on success, but if it returns instead:
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
    : []

  const filteredProps = propSearch
    ? properties
        .filter((p) => p.title.toLowerCase().includes(propSearch.toLowerCase()))
        .slice(0, 8)
    : []

  const buttonClass =
    variant === 'primary'
      ? 'inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[4px] bg-ink text-paper text-[13px] font-medium hover:bg-coal transition-colors'
      : 'inline-flex items-center gap-1.5 h-9 px-3 rounded-[4px] bg-ink text-paper text-[13px] font-medium hover:bg-coal transition-colors'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonClass}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={1.8} />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => {
              if (!pending) {
                setOpen(false)
                reset()
              }
            }}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-[480px] rounded-t-[16px] md:rounded-[16px] bg-paper shadow-lg border border-bone overflow-hidden">
            <div className="flex items-center justify-between border-b border-bone px-5 py-3.5">
              <h2 className="text-[15px] font-medium text-ink">
                Nueva operación
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!pending) {
                    setOpen(false)
                    reset()
                  }
                }}
                className="p-1 rounded-md text-steel hover:text-ink hover:bg-bone-soft"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Lead picker */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-ink">
                  Cliente
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => {
                      setLeadSearch(e.target.value)
                      if (selectedLeadId) setSelectedLeadId(null)
                    }}
                    placeholder={
                      loadingOptions
                        ? 'Cargando leads...'
                        : 'Buscar lead por nombre o teléfono...'
                    }
                    disabled={loadingOptions}
                    className="h-10 w-full rounded-[8px] border border-bone bg-paper pl-8 pr-3 text-[13px] focus:border-ink focus:outline-none focus:ring-0 disabled:opacity-60"
                  />
                </div>
                {leadSearch && !selectedLeadId && filteredLeads.length > 0 && (
                  <div className="rounded-[8px] border border-bone bg-paper overflow-hidden divide-y divide-bone-soft">
                    {filteredLeads.map((lead) => (
                      <button
                        key={lead.id}
                        type="button"
                        onClick={() => handleSelectLead(lead)}
                        className="w-full text-left px-3 py-2 hover:bg-bone-soft text-[12px] text-ink"
                      >
                        <div className="font-medium">{lead.full_name}</div>
                        {(lead.phone || lead.email) && (
                          <div className="text-[11px] text-steel font-mono">
                            {lead.phone ?? lead.email}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {leadSearch && !selectedLeadId && filteredLeads.length === 0 && (
                  <p className="text-[11px] text-steel">
                    Sin coincidencias. Creá el lead primero desde Leads.
                  </p>
                )}
              </div>

              {/* Property picker (optional) */}
              <div className="space-y-1.5">
                <label className="block text-[12px] font-medium text-ink">
                  Propiedad inicial{' '}
                  <span className="text-steel font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={propSearch}
                    onChange={(e) => {
                      setPropSearch(e.target.value)
                      if (selectedPropertyId) setSelectedPropertyId(null)
                    }}
                    placeholder="Buscar propiedad por título..."
                    className="h-10 w-full rounded-[8px] border border-bone bg-paper pl-8 pr-3 text-[13px] focus:border-ink focus:outline-none focus:ring-0"
                  />
                </div>
                {propSearch && !selectedPropertyId && filteredProps.length > 0 && (
                  <div className="rounded-[8px] border border-bone bg-paper overflow-hidden divide-y divide-bone-soft">
                    {filteredProps.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPropertyId(p.id)
                          setPropSearch(p.title)
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-bone-soft text-[12px] text-ink"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-steel-soft">
                  Podés agregar más propiedades desde la página de la operación.
                </p>
              </div>

              {/* Stage + amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-ink">
                    Stage inicial
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-10 w-full rounded-[8px] border border-bone bg-paper px-3 text-[13px] text-ink focus:border-ink focus:outline-none"
                  >
                    {STAGES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-ink">
                    Monto estimado{' '}
                    <span className="text-steel font-normal">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="450000"
                    className="h-10 w-full rounded-[8px] border border-bone bg-paper px-3 text-[13px] font-mono tabular-nums focus:border-ink focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-[6px] border border-signal/30 bg-signal-bg px-3 py-2 text-[12px] text-signal-deep">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-bone px-5 py-3">
              <button
                type="button"
                onClick={() => {
                  if (!pending) {
                    setOpen(false)
                    reset()
                  }
                }}
                disabled={pending}
                className="px-3 py-2 text-[12px] text-steel hover:text-ink transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={pending || !selectedLeadId}
                className="px-4 py-2 rounded-[8px] bg-ink text-white text-[12px] font-medium hover:bg-coal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? 'Creando…' : 'Crear operación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
