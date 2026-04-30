'use client'

import { FileText, ImageOff, Sparkles } from 'lucide-react'

/**
 * Document preview pane. Renders the file inline based on its extension:
 * - Images (jpg/png/webp/heic) → `<img>` directly via signed URL
 * - PDFs → `<iframe>` with the signed URL (browsers handle preview)
 * - Demo files → stylized placeholder with the filename
 * - No file or unknown type → empty state
 *
 * The signed URL is generated server-side with a 5-minute TTL — refreshing
 * the page regenerates a fresh URL.
 */
export function DocumentPreview({
  signedUrl,
  fileName,
  isImage,
  isPdf,
  isDemo,
  hasFile,
}: {
  signedUrl: string | null
  fileName: string | null
  isImage: boolean
  isPdf: boolean
  isDemo: boolean
  hasFile: boolean
}) {
  // Empty state — no file uploaded yet
  if (!hasFile) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center rounded-[4px] border border-dashed border-bone bg-bone/20 p-8 text-center md:aspect-[3/4]">
        <ImageOff className="mb-3 h-8 w-8 text-steel" strokeWidth={1.5} />
        <p className="text-[14px] font-medium text-ink">Sin archivo subido</p>
        <p className="mt-1 max-w-xs text-[12px] text-steel">
          Subí el documento desde el expediente principal para empezar la
          revisión.
        </p>
      </div>
    )
  }

  // Demo file — synthetic preview matching the doc style
  if (isDemo) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] border border-bone bg-coal md:aspect-[3/4]">
        {/* Scanline pattern */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 49%, rgba(255,255,255,0.06) 50%, transparent 51%)',
            backgroundSize: '100% 24px',
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <FileText className="h-10 w-10 text-paper/80" strokeWidth={1.5} />
          <p className="font-mono text-[12px] uppercase tracking-wider text-paper/90">
            {fileName ?? 'documento'}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-signal px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper">
            <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            Demo
          </span>
          <p className="max-w-xs font-mono text-[10px] text-paper/60">
            Documento de muestra · no descargable. En producción el archivo
            real se mostraría aquí.
          </p>
        </div>
      </div>
    )
  }

  // Real image
  if (isImage && signedUrl) {
    return (
      <div className="overflow-hidden rounded-[4px] border border-bone bg-coal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt={fileName ?? 'Documento'}
          className="h-auto w-full max-h-[80vh] object-contain"
        />
      </div>
    )
  }

  // PDF
  if (isPdf && signedUrl) {
    return (
      <div className="overflow-hidden rounded-[4px] border border-bone bg-bone/30">
        <iframe
          src={signedUrl}
          title={fileName ?? 'Documento PDF'}
          className="h-[80vh] w-full"
        />
      </div>
    )
  }

  // Fallback — unknown extension, just offer download via the URL
  if (signedUrl) {
    return (
      <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[4px] border border-bone bg-paper p-8 text-center md:aspect-[3/4]">
        <FileText className="h-10 w-10 text-ink" strokeWidth={1.5} />
        <p className="text-[14px] font-medium text-ink">
          Vista previa no disponible
        </p>
        <p className="max-w-xs text-[12px] text-steel">
          El formato del archivo no permite preview en línea.
        </p>
        <a
          href={signedUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 rounded-[4px] bg-ink px-4 py-2 text-[13px] font-medium text-paper transition-colors hover:bg-coal"
        >
          Abrir archivo
        </a>
      </div>
    )
  }

  // Has file but signed URL failed — should be rare
  return (
    <div className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-[4px] border border-bone bg-paper p-8 text-center md:aspect-[3/4]">
      <ImageOff className="h-8 w-8 text-steel" strokeWidth={1.5} />
      <p className="text-[14px] font-medium text-ink">
        No se pudo cargar el archivo
      </p>
    </div>
  )
}
