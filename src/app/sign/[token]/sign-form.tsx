'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signDocument } from './actions'

export function SignForm({
  token,
  defaultName,
  documentTitle,
}: {
  token: string
  defaultName: string
  documentTitle: string
}) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    setError(null)
    if (!name.trim()) {
      setError('Escribí tu nombre completo')
      return
    }
    if (!accepted) {
      setError('Tenés que aceptar para poder firmar')
      return
    }
    startTransition(async () => {
      const result = await signDocument(token, name.trim())
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <section className="rounded-[12px] border border-bone bg-paper p-6 space-y-4">
      <div>
        <h2 className="text-[16px] font-medium text-ink mb-1">
          Firmá el documento
        </h2>
        <p className="text-[13px] text-steel">
          Tu firma queda registrada con tu IP, fecha y hora — y tiene plena
          validez legal en Panamá según la Ley 51 de 2008.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="signer-name"
          className="block text-[13px] text-ink"
        >
          Escribí tu nombre completo
        </label>
        <input
          id="signer-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Juan Pérez"
          className="h-12 w-full rounded-[6px] border border-bone bg-paper px-3 text-[16px] text-ink focus:border-ink focus:outline-none focus:ring-0"
          autoComplete="name"
        />
        <p className="font-mono text-[10px] uppercase tracking-[1.2px] text-steel">
          Esto es tu firma
        </p>
      </div>

      {name.trim() && (
        <div className="rounded-[8px] border border-dashed border-steel-soft bg-paper-warm px-4 py-6 text-center">
          <div className="font-mono text-[9px] tracking-[1.2px] uppercase text-steel mb-2">
            Vista previa de tu firma
          </div>
          <div
            className="text-[28px] text-ink"
            style={{ fontFamily: 'cursive' }}
          >
            {name}
          </div>
        </div>
      )}

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-ink"
        />
        <span className="text-[13px] text-ink leading-snug">
          Confirmo que soy <strong>{name || '[escribí tu nombre]'}</strong> y
          acepto el contenido del documento "{documentTitle}". Acepto que
          esta firma electrónica tiene la misma validez que una firma
          manuscrita.
        </span>
      </label>

      {error && (
        <p className="rounded-[6px] border border-signal/30 bg-signal-bg px-3 py-2 text-[13px] text-signal-deep">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || !name.trim() || !accepted}
        className="w-full h-12 rounded-[6px] bg-ink text-white text-[14px] font-medium hover:bg-coal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Firmando…' : 'Firmar documento'}
      </button>
    </section>
  )
}
