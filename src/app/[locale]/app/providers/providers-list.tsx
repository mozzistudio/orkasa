'use client'

import { useState, useTransition } from 'react'
import { Plus, Phone, Mail, MoreVertical, Pencil, Trash2, MessageCircle } from 'lucide-react'
import { ProviderForm, type ProviderRow } from './provider-form'
import { deleteProvider } from './actions'
import {
  SERVICE_TYPE_META,
  SERVICE_TYPE_ORDER,
  type ServiceType,
} from './service-types'

function buildWhatsAppUrl(phone: string): string {
  const sanitized = phone.replace(/[^\d+]/g, '')
  return `https://wa.me/${sanitized.replace(/^\+/, '')}`
}

export function ProvidersList({ providers }: { providers: ProviderRow[] }) {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProviderRow | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(provider: ProviderRow) {
    setEditing(provider)
    setFormOpen(true)
    setMenuFor(null)
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) {
      return
    }
    startTransition(async () => {
      await deleteProvider(id)
      setMenuFor(null)
    })
  }

  // Group by service type
  const byType = new Map<ServiceType, ProviderRow[]>()
  for (const p of providers) {
    const t = p.service_type as ServiceType
    if (!byType.has(t)) byType.set(t, [])
    byType.get(t)!.push(p)
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
            Proveedores
            <span className="ml-3 font-mono text-[12px] tabular-nums text-steel">
              {providers.length}
            </span>
          </h1>
          <p className="mt-1 text-[13px] text-steel">
            Tu red de notarios, abogados, bancos y otros aliados. Se usa para
            generar mensajes de WhatsApp y datos en documentos.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] font-medium text-ink hover:bg-bone-soft transition-colors md:px-4"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span className="hidden md:inline">Nuevo proveedor</span>
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="rounded-[4px] border border-dashed border-bone bg-paper p-10 text-center">
          <p className="text-[14px] font-medium text-ink">Aún no tenés proveedores cargados</p>
          <p className="mt-1.5 text-[13px] text-steel">
            Añadí a tu notario, abogado y bancos de cabecera para activar las
            CTAs de WhatsApp en las tareas (ej. &quot;Notificar abogado para promesa&quot;).
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="mt-5 inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-coal transition-colors"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Cargar primer proveedor
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {SERVICE_TYPE_ORDER.map((type) => {
            const list = byType.get(type)
            if (!list || list.length === 0) return null
            const meta = SERVICE_TYPE_META[type]
            return (
              <section key={type}>
                <div className="mb-2.5 flex items-baseline gap-2">
                  <h2 className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel">
                    {meta.label}
                  </h2>
                  <span className="font-mono text-[10px] tabular-nums text-steel-soft">
                    {list.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {list.map((p) => (
                    <article
                      key={p.id}
                      className="relative rounded-[4px] border border-bone bg-paper p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[14px] font-medium text-ink truncate">
                              {p.name}
                            </h3>
                            {p.is_primary && (
                              <span className="inline-flex shrink-0 items-center font-mono text-[9px] uppercase tracking-[1.2px] text-signal-deep bg-signal-bg px-1.5 py-0.5 rounded-[2px]">
                                Primario
                              </span>
                            )}
                          </div>
                          {p.company && (
                            <p className="mt-0.5 text-[12px] text-steel truncate">
                              {p.company}
                            </p>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuFor(menuFor === p.id ? null : p.id)
                            }
                            className="p-1 rounded-[4px] text-steel hover:bg-bone-soft hover:text-ink"
                            aria-label="Opciones"
                          >
                            <MoreVertical
                              className="h-4 w-4"
                              strokeWidth={1.5}
                            />
                          </button>
                          {menuFor === p.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuFor(null)}
                              />
                              <div className="absolute right-0 top-7 z-20 w-36 rounded-[4px] border border-bone bg-paper py-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(p)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-ink hover:bg-bone-soft text-left"
                                >
                                  <Pencil
                                    className="h-3 w-3"
                                    strokeWidth={1.5}
                                  />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(p.id, p.name)}
                                  className="flex w-full items-center gap-2 px-3 py-1.5 text-[12px] text-signal hover:bg-signal-bg text-left"
                                >
                                  <Trash2
                                    className="h-3 w-3"
                                    strokeWidth={1.5}
                                  />
                                  Eliminar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="mt-3 space-y-1">
                        {p.phone && (
                          <div className="flex items-center gap-2 font-mono text-[11px] text-steel">
                            <Phone className="h-3 w-3" strokeWidth={1.5} />
                            <span>{p.phone}</span>
                          </div>
                        )}
                        {p.email && (
                          <div className="flex items-center gap-2 font-mono text-[11px] text-steel">
                            <Mail className="h-3 w-3" strokeWidth={1.5} />
                            <span className="truncate">{p.email}</span>
                          </div>
                        )}
                        {(p.license_number || p.tax_id) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 pt-1 font-mono text-[10px] uppercase tracking-[0.8px] text-steel-soft">
                            {p.license_number && (
                              <span>
                                {SERVICE_TYPE_META[type].licenseLabel}:{' '}
                                <span className="normal-case tracking-normal text-steel">
                                  {p.license_number}
                                </span>
                              </span>
                            )}
                            {p.tax_id && (
                              <span>
                                Cédula:{' '}
                                <span className="normal-case tracking-normal text-steel">
                                  {p.tax_id}
                                </span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quick actions */}
                      {p.phone && (
                        <div className="mt-3 flex items-center gap-2 border-t border-bone-soft pt-3">
                          <a
                            href={buildWhatsAppUrl(p.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-bone-soft transition-colors"
                          >
                            <MessageCircle
                              className="h-3 w-3"
                              strokeWidth={1.5}
                            />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${p.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 rounded-[4px] border border-bone bg-paper px-2.5 py-1.5 text-[11px] font-medium text-ink hover:bg-bone-soft transition-colors"
                          >
                            <Phone className="h-3 w-3" strokeWidth={1.5} />
                            Llamar
                          </a>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <ProviderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        initial={editing}
      />
    </>
  )
}
