'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { buildReminderUrl } from '@/lib/whatsapp-templates'

type Props = {
  open: boolean
  onClose: () => void
  propertyPrice?: number
  phone?: string
  clientName?: string
}

function fmt(n: number) {
  return n.toLocaleString('es-PA', { maximumFractionDigits: 0 })
}

function computeLoan(price: number, downPct: number, years: number, rate: number) {
  const principal = price * (1 - downPct / 100)
  const monthlyRate = rate / 100 / 12
  const n = years * 12
  const monthly = monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
      (Math.pow(1 + monthlyRate, n) - 1)
    : principal / n
  return {
    principal,
    monthly,
    totalCost: monthly * n,
    totalInterest: monthly * n - principal,
  }
}

export function FinancingSimModal({
  open,
  onClose,
  propertyPrice = 0,
  phone,
  clientName,
}: Props) {
  const [price, setPrice] = useState(propertyPrice)
  const [downPct, setDownPct] = useState(10)
  const [years, setYears] = useState(25)
  const [rate, setRate] = useState(6.5)

  const loan = computeLoan(price, downPct, years, rate)

  function handleWhatsApp() {
    if (!phone) return
    const name = clientName ?? 'Cliente'
    const msg = `Hola ${name}, te comparto una simulación de financiamiento:\n\n` +
      `Precio: $${fmt(price)}\n` +
      `Inicial: ${downPct}% ($${fmt(price * downPct / 100)})\n` +
      `Plazo: ${years} años a ${rate}%\n` +
      `Cuota mensual: $${fmt(loan.monthly)}\n\n` +
      `¿Te gustaría que avancemos con la pre-aprobación?`
    window.open(buildReminderUrl(phone, msg), '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Simulador de financiamiento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Precio (USD)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={0}
              className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink font-mono focus:border-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
              Inicial: {downPct}%
              <span className="ml-2 text-ink">
                (${fmt(price * downPct / 100)})
              </span>
            </label>
            <input
              type="range"
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              min={5}
              max={50}
              step={5}
              className="w-full accent-signal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
                Plazo (años)
              </label>
              <select
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink focus:border-ink focus:outline-none"
              >
                {[15, 20, 25, 30].map((y) => (
                  <option key={y} value={y}>{y} años</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-[1.4px] text-steel block mb-1">
                Tasa (%)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                min={0}
                max={20}
                step={0.25}
                className="w-full rounded-[4px] border border-bone bg-paper px-3 py-2 text-[13px] text-ink font-mono focus:border-ink focus:outline-none"
              />
            </div>
          </div>

          {price > 0 && (
            <div className="rounded-[4px] border border-bone bg-paper-warm p-4 space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-steel">Cuota mensual</span>
                <span className="font-mono font-medium text-ink">
                  ${fmt(loan.monthly)}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-steel">Monto financiado</span>
                <span className="font-mono text-ink">${fmt(loan.principal)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-steel">Costo total</span>
                <span className="font-mono text-ink">${fmt(loan.totalCost)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-steel">Intereses totales</span>
                <span className="font-mono text-steel">${fmt(loan.totalInterest)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {phone && (
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-2 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
            >
              Enviar al cliente
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
