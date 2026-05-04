'use client'

import { useState, useTransition, useEffect } from 'react'
import { X } from 'lucide-react'
import { createProvider, updateProvider } from './actions'
import {
  SERVICE_TYPE_META,
  SERVICE_TYPE_ORDER,
  type ServiceType,
} from './service-types'

export type ProviderRow = {
  id: string
  service_type: string
  name: string
  company: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  license_number: string | null
  address: string | null
  city: string | null
  notes: string | null
  is_primary: boolean
}

export function ProviderForm({
  open,
  onClose,
  initial,
}: {
  open: boolean
  onClose: () => void
  initial?: ProviderRow | null
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [serviceType, setServiceType] = useState<ServiceType>(
    (initial?.service_type as ServiceType) || 'notario',
  )
  const [name, setName] = useState(initial?.name || '')
  const [company, setCompany] = useState(initial?.company || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [taxId, setTaxId] = useState(initial?.tax_id || '')
  const [licenseNumber, setLicenseNumber] = useState(
    initial?.license_number || '',
  )
  const [address, setAddress] = useState(initial?.address || '')
  const [city, setCity] = useState(initial?.city || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [isPrimary, setIsPrimary] = useState(initial?.is_primary || false)

  // Reset form when `initial` changes (open for different provider)
  useEffect(() => {
    if (!open) return
    setServiceType((initial?.service_type as ServiceType) || 'notario')
    setName(initial?.name || '')
    setCompany(initial?.company || '')
    setPhone(initial?.phone || '')
    setEmail(initial?.email || '')
    setTaxId(initial?.tax_id || '')
    setLicenseNumber(initial?.license_number || '')
    setAddress(initial?.address || '')
    setCity(initial?.city || '')
    setNotes(initial?.notes || '')
    setIsPrimary(initial?.is_primary || false)
    setError(null)
  }, [initial, open])

  if (!open) return null

  const meta = SERVICE_TYPE_META[serviceType]

  function handleSubmit() {
    setError(null)
    const fd = new FormData()
    fd.set('service_type', serviceType)
    fd.set('name', name)
    fd.set('company', company)
    fd.set('phone', phone)
    fd.set('email', email)
    fd.set('tax_id', taxId)
    fd.set('license_number', licenseNumber)
    fd.set('address', address)
    fd.set('city', city)
    fd.set('notes', notes)
    if (isPrimary) fd.set('is_primary', 'on')

    startTransition(async () => {
      const result = initial
        ? await updateProvider(initial.id, fd)
        : await createProvider(fd)
      if (result.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => {
          if (!pending) onClose()
        }}
      />
      <div className="relative z-10 w-full max-w-[560px] rounded-t-[8px] md:rounded-[4px] border border-bone bg-paper overflow-hidden">
        <div className="flex items-center justify-between border-b border-bone px-5 py-3.5">
          <h2 className="text-[15px] font-medium text-ink">
            {initial ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!pending) onClose()
            }}
            className="p-1 rounded-[4px] text-steel hover:text-ink hover:bg-bone-soft"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Service type */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-ink">
              Tipo de servicio
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] text-ink focus:border-ink focus:outline-none"
            >
              {SERVICE_TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {SERVICE_TYPE_META[t].label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-steel">{meta.hint}</p>
          </div>

          {/* Name + company */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                Nombre completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                {meta.companyLabel}
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder={meta.companyLabel}
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Phone + email */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                Teléfono <span className="text-steel font-normal">(WhatsApp)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+507 6000-0000"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 font-mono text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@ejemplo.com"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 font-mono text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Tax ID + License */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                Cédula / RUC{' '}
                <span className="text-steel font-normal">(documentos)</span>
              </label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="8-XXX-XXXX"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 font-mono text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                {meta.licenseLabel}
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 font-mono text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Address + city */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-[12px] font-medium text-ink">
                Dirección
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle 50, Edificio Plaza, Piso 8"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-ink">
                Ciudad
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Panamá"
                className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-ink">
              Notas{' '}
              <span className="text-steel font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Honorarios habituales, especialidad, recomendaciones..."
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] focus:border-ink focus:outline-none resize-none"
            />
          </div>

          {/* Primary toggle */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-[2px] border-bone accent-ink"
            />
            <div className="text-[12px]">
              <span className="font-medium text-ink">
                Marcar como primario
              </span>
              <p className="text-steel">
                Se usará por defecto cuando una tarea necesite contactar
                un {meta.short.toLowerCase()}.
              </p>
            </div>
          </label>

          {error && (
            <p className="rounded-[4px] border border-signal/30 bg-signal-bg px-3 py-2 text-[12px] text-signal-deep">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-bone px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (!pending) onClose()
            }}
            disabled={pending}
            className="px-3 py-2 text-[12px] text-steel hover:text-ink transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending || !name.trim()}
            className="px-4 py-2 rounded-[4px] bg-ink text-paper text-[12px] font-medium hover:bg-coal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}
