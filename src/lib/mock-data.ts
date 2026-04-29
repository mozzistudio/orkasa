export const MOCK_METRICS = [
  {
    label: 'Inventario activo',
    value: '24',
    change: '+3',
    trend: 'up' as const,
  },
  {
    label: 'Leads 7d',
    value: '18',
    change: '+12%',
    trend: 'up' as const,
  },
  {
    label: 'Visitas agendadas',
    value: '7',
    change: '—',
    trend: 'neutral' as const,
  },
  {
    label: 'Tasa de cierre',
    value: '3.2%',
    change: '+0.4pp',
    trend: 'up' as const,
  },
]

export const MOCK_LEADS = [
  { id: '1', name: 'María García', origin: 'Portal', score: 92, assigned: 'Carlos R.', date: '28 abr' },
  { id: '2', name: 'Roberto Chen', origin: 'Referido', score: 87, assigned: 'Ana M.', date: '28 abr' },
  { id: '3', name: 'Lucía Fernández', origin: 'Web', score: 78, assigned: 'Carlos R.', date: '27 abr' },
  { id: '4', name: 'David Morales', origin: 'WhatsApp', score: 74, assigned: 'Sin asignar', date: '27 abr' },
  { id: '5', name: 'Patricia Vega', origin: 'Portal', score: 71, assigned: 'Ana M.', date: '26 abr' },
  { id: '6', name: 'Andrés Ruiz', origin: 'Web', score: 68, assigned: 'Carlos R.', date: '26 abr' },
  { id: '7', name: 'Carmen Díaz', origin: 'Referido', score: 65, assigned: 'Sin asignar', date: '25 abr' },
  { id: '8', name: 'Miguel Soto', origin: 'Portal', score: 61, assigned: 'Ana M.', date: '25 abr' },
  { id: '9', name: 'Sofía Herrera', origin: 'WhatsApp', score: 58, assigned: 'Carlos R.', date: '24 abr' },
  { id: '10', name: 'Jorge Castillo', origin: 'Web', score: 54, assigned: 'Sin asignar', date: '24 abr' },
]

export const MOCK_PROPERTIES = [
  {
    id: '04829',
    title: 'Costa del Este PH',
    location: 'CDE · 3BR · 180m²',
    price: 485000,
    leads: 8,
    score: 92,
  },
  {
    id: '04831',
    title: 'Punta Pacífica tower',
    location: 'PP · 2BR · 120m²',
    price: 325000,
    leads: 5,
    score: 84,
  },
  {
    id: '04835',
    title: 'Clayton residence',
    location: 'CLY · 4BR · 280m²',
    price: 620000,
    leads: 3,
    score: 76,
  },
]
