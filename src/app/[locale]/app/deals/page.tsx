import { redirect } from 'next/navigation'

// Legacy URL — the deals concept is now exposed as "Operaciones"
export default function DealsPage() {
  redirect('/app/operaciones')
}
