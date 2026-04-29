'use client'

import { useState } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const MAX_IMAGES = 12

export type StoredImage = {
  path: string // storage path: brokerage_id/property_id/filename
  url: string // public URL
}

export function ImageUpload({
  brokerageId,
  propertyId,
  initialImages,
  hiddenInputName = 'images',
}: {
  brokerageId: string
  propertyId: string
  initialImages?: StoredImage[]
  hiddenInputName?: string
}) {
  const [images, setImages] = useState<StoredImage[]>(initialImages ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)

    const remaining = MAX_IMAGES - images.length
    const toUpload = Array.from(files).slice(0, remaining)
    if (files.length > remaining) {
      setError(`Máximo ${MAX_IMAGES} imágenes por propiedad.`)
    }

    setUploading(true)
    const supabase = createClient()
    const uploaded: StoredImage[] = []

    for (const file of toUpload) {
      // Path: <brokerage_id>/<property_id>/<timestamp>-<safeName>
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .slice(-80)
      const path = `${brokerageId}/${propertyId}/${Date.now()}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from('property-images')
        .upload(path, file, { contentType: file.type, upsert: false })

      if (upErr) {
        setError(upErr.message)
        continue
      }

      const { data: pub } = supabase.storage
        .from('property-images')
        .getPublicUrl(path)
      uploaded.push({ path, url: pub.publicUrl })
    }

    setImages((prev) => [...prev, ...uploaded])
    setUploading(false)
  }

  async function handleRemove(image: StoredImage) {
    const supabase = createClient()
    const { error: delErr } = await supabase.storage
      .from('property-images')
      .remove([image.path])
    if (delErr) {
      setError(delErr.message)
      return
    }
    setImages((prev) => prev.filter((i) => i.path !== image.path))
  }

  return (
    <div className="space-y-3">
      {/* Hidden field that the form action reads — JSON serialized */}
      <input
        type="hidden"
        name={hiddenInputName}
        value={JSON.stringify(images)}
      />

      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        {images.map((img) => (
          <div
            key={img.path}
            className="group relative aspect-square overflow-hidden rounded-[4px] border border-bone bg-coal"
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="(max-width: 768px) 33vw, 25vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemove(img)}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-[4px] bg-ink/80 text-paper opacity-0 transition-opacity hover:bg-signal group-hover:opacity-100"
              aria-label="Remove"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[4px] border border-dashed border-bone bg-paper text-steel transition-colors hover:border-ink hover:text-ink ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <ImageIcon className="h-5 w-5 animate-pulse" strokeWidth={1.5} />
            ) : (
              <Upload className="h-5 w-5" strokeWidth={1.5} />
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider">
              {uploading ? 'Subiendo…' : 'Cargar'}
            </span>
          </label>
        )}
      </div>

      {error && (
        <p className="rounded-[4px] border border-signal/30 bg-signal-soft px-3 py-2 text-[13px] text-signal">
          {error}
        </p>
      )}

      <p className="font-mono text-[11px] text-steel">
        JPG, PNG o WebP · Máx 10MB · Hasta {MAX_IMAGES} imágenes
      </p>
    </div>
  )
}
