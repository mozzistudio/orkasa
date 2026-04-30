'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

type FormState =
  | { stage: 'idle' }
  | { stage: 'submitting' }
  | { stage: 'success' }
  | { stage: 'error'; message: string }

const REASONS = [
  { id: 'demo', label: 'Pedir una demo personalizada' },
  { id: 'enterprise', label: 'Plan enterprise / brokerage grande' },
  { id: 'integration', label: 'Integración custom' },
  { id: 'partnership', label: 'Partnership / portal' },
  { id: 'press', label: 'Prensa' },
  { id: 'other', label: 'Otro' },
] as const

export function ContactForm() {
  const [state, setState] = useState<FormState>({ stage: 'idle' })

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setState({ stage: 'submitting' })

    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())

    try {
      // TODO: replace with real /api/contact endpoint when wired
      // For now we simulate success after 600ms so the UI is testable
      await new Promise((resolve) => setTimeout(resolve, 600))
      // eslint-disable-next-line no-console
      console.log('[contact] submitted', payload)
      setState({ stage: 'success' })
    } catch (err) {
      setState({
        stage: 'error',
        message: err instanceof Error ? err.message : 'Error desconocido',
      })
    }
  }

  if (state.stage === 'success') {
    return (
      <div className="rounded-[4px] border border-bone bg-paper p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#0A6B3D]/10">
          <Check className="h-6 w-6 text-[#0A6B3D]" strokeWidth={1.5} />
        </div>
        <h2 className="mt-4 text-center text-[20px] font-medium text-ink">
          Recibimos tu mensaje
        </h2>
        <p className="mt-2 text-center text-[13px] leading-relaxed text-steel">
          Te contestamos en menos de 24 horas hábiles. Si es urgente,
          escribinos directo a{' '}
          <a
            href="mailto:hola@orkasa.io"
            className="text-signal hover:text-signal/80"
          >
            hola@orkasa.io
          </a>
          .
        </p>
      </div>
    )
  }

  const submitting = state.stage === 'submitting'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-[4px] border border-bone bg-paper p-5 md:p-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre" name="name" required />
        <Field label="Email" name="email" type="email" required />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Empresa / inmobiliaria" name="company" />
        <Field label="País" name="country" placeholder="Panamá, RD, Colombia…" />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="reason"
          className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel"
        >
          Motivo
        </label>
        <select
          id="reason"
          name="reason"
          defaultValue="demo"
          className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
        >
          {REASONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel"
        >
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] leading-relaxed focus:border-ink focus:outline-none"
        />
      </div>

      {state.stage === 'error' && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-[4px] bg-ink px-4 py-3 text-[13px] font-medium text-paper transition-colors hover:bg-coal disabled:opacity-60 md:w-auto md:py-2.5"
      >
        {submitting ? 'Enviando…' : 'Enviar mensaje'}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="font-mono text-[10px] uppercase tracking-[1.5px] text-steel"
      >
        {label}
        {required && <span className="ml-1 text-signal">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="h-10 w-full rounded-[4px] border border-bone bg-paper px-3 text-[13px] focus:border-ink focus:outline-none"
      />
    </div>
  )
}
