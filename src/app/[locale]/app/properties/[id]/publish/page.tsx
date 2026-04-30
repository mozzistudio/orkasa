import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { INTEGRATION_PROVIDERS } from '@/lib/integrations'
import type { Database } from '@/lib/database.types'
import type { StoredImage } from '@/components/app/image-upload'
import { PublishWizard } from './wizard'

type Property = Database['public']['Tables']['properties']['Row']
type Publication = Database['public']['Tables']['property_publications']['Row']

export default async function PublishPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [propertyRes, publicationsRes] = await Promise.all([
    supabase.from('properties').select('*').eq('id', id).maybeSingle<Property>(),
    supabase
      .from('property_publications')
      .select('*')
      .eq('property_id', id)
      .returns<Publication[]>(),
  ])

  const property = propertyRes.data
  if (!property) notFound()

  const images: StoredImage[] = Array.isArray(property.images)
    ? (property.images as unknown as StoredImage[])
    : []

  // Only providers that have an adapter spec can be used in the wizard
  const adaptableProviders = INTEGRATION_PROVIDERS.filter((p) => p.adapter)

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href={`/app/properties/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {property.title}
      </Link>

      <h1 className="text-[22px] font-medium tracking-[-0.5px] text-ink">
        Publicar en portales
      </h1>
      <p className="mt-1 text-[13px] text-steel">
        IA adapta el texto para cada plataforma. Validá cada uno antes de
        publicar.
      </p>

      <div className="mt-8">
        <PublishWizard
          property={{
            id: property.id,
            title: property.title,
            description: property.description ?? '',
            currency: property.currency ?? 'USD',
            price: property.price ? Number(property.price) : null,
            neighborhood: property.neighborhood,
            city: property.city,
          }}
          images={images}
          providers={adaptableProviders}
          existingPublications={publicationsRes.data ?? []}
        />
      </div>
    </div>
  )
}
