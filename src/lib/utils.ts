import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Compact currency formatter — renders large amounts as `$1.3M` / `$485K`
 * to fit narrow KPI cards on mobile. Falls back to full digits under $10K.
 */
export function formatPriceCompact(amount: number): string {
  if (amount === 0) return '$0'
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1)}M`
  }
  if (Math.abs(amount) >= 10_000) {
    return `$${Math.round(amount / 1_000)}K`
  }
  return formatPrice(amount)
}
