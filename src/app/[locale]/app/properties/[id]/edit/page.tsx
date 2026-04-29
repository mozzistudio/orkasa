import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { PropertyForm } from '@/components/app/property-form'
import { updateProperty } from '../../actions'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { StoredImage } from '@/components/app/image-upload'

type Property = Database['public']['Tables']['properties']['Row']

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('properties')
  const { id } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .maybeSingle<Property>()

  if (!property) {
    notFound()
  }

  const updateWithId = updateProperty.bind(null, id)

  // Parse existing images jsonb
  const initialImages: StoredImage[] = Array.isArray(property.images)
    ? (property.images as unknown as StoredImage[])
    : []

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/app/properties/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-steel hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
        {property.title}
      </Link>

      <h1 className="mb-8 text-[22px] font-medium tracking-[-0.5px] text-ink">
        {t('edit')}
      </h1>

      <div className="rounded-[4px] border border-bone bg-paper p-6">
        <PropertyForm
          action={updateWithId}
          submitLabel={t('save')}
          brokerageId={property.brokerage_id}
          propertyId={property.id}
          defaults={{
            title: property.title,
            description: property.description,
            property_type: property.property_type,
            listing_type: property.listing_type,
            status: property.status ?? 'draft',
            price: property.price ? Number(property.price) : null,
            currency: property.currency,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms ? Number(property.bathrooms) : null,
            area_m2: property.area_m2 ? Number(property.area_m2) : null,
            address: property.address,
            neighborhood: property.neighborhood,
            city: property.city,
            external_id: property.external_id,
            images: initialImages,
          }}
        />
      </div>
    </div>
  )
}
