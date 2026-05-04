export type ServiceType =
  | 'notario'
  | 'abogado'
  | 'banco'
  | 'tasador'
  | 'inspector'
  | 'topografo'
  | 'registro_publico'
  | 'aseguradora'
  | 'contador'
  | 'otro'

type TypeMeta = {
  label: string
  short: string
  companyLabel: string
  licenseLabel: string
  hint: string
}

export const SERVICE_TYPE_META: Record<ServiceType, TypeMeta> = {
  notario: {
    label: 'Notario',
    short: 'Notario',
    companyLabel: 'Notaría',
    licenseLabel: 'Número de notaría',
    hint: 'Para escrituras públicas y promesas. Notaría XX, Circuito de Panamá.',
  },
  abogado: {
    label: 'Abogado',
    short: 'Abogado',
    companyLabel: 'Bufete / firma',
    licenseLabel: 'Número de idoneidad',
    hint: 'Redacta promesas, contratos y due diligence.',
  },
  banco: {
    label: 'Banco / ejecutivo',
    short: 'Banco',
    companyLabel: 'Banco',
    licenseLabel: 'Código de oficial',
    hint: 'Ejecutivo bancario para préstamos hipotecarios.',
  },
  tasador: {
    label: 'Tasador / avaluador',
    short: 'Tasador',
    companyLabel: 'Empresa',
    licenseLabel: 'Resolución MEF',
    hint: 'Avalúo de propiedad para banco o trámite.',
  },
  inspector: {
    label: 'Inspector',
    short: 'Inspector',
    companyLabel: 'Empresa',
    licenseLabel: 'Idoneidad',
    hint: 'Inspección estructural / técnica de la propiedad.',
  },
  topografo: {
    label: 'Topógrafo',
    short: 'Topógrafo',
    companyLabel: 'Empresa',
    licenseLabel: 'Idoneidad',
    hint: 'Levantamiento topográfico, deslinde de terreno.',
  },
  registro_publico: {
    label: 'Registro Público',
    short: 'Registro',
    companyLabel: 'Oficina',
    licenseLabel: 'Código',
    hint: 'Trámites de inscripción y certificaciones.',
  },
  aseguradora: {
    label: 'Aseguradora',
    short: 'Aseguradora',
    companyLabel: 'Aseguradora',
    licenseLabel: 'Código de agente',
    hint: 'Seguro de hogar, ARI o título.',
  },
  contador: {
    label: 'Contador',
    short: 'Contador',
    companyLabel: 'Firma',
    licenseLabel: 'Idoneidad CPA',
    hint: 'Trámites fiscales y certificaciones de ingreso.',
  },
  otro: {
    label: 'Otro',
    short: 'Otro',
    companyLabel: 'Empresa',
    licenseLabel: 'Licencia / código',
    hint: 'Otro tipo de proveedor.',
  },
}

export const SERVICE_TYPE_ORDER: ServiceType[] = [
  'notario',
  'abogado',
  'banco',
  'tasador',
  'inspector',
  'topografo',
  'registro_publico',
  'aseguradora',
  'contador',
  'otro',
]
