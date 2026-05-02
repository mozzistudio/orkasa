import type { IntegrationProviderMeta } from '@/lib/integrations'

/**
 * Extract a clean domain from a website URL for favicon lookup.
 * "https://www.encuentra24.com/path" → "encuentra24.com"
 */
function domainOf(website: string | undefined): string | null {
  if (!website) return null
  try {
    const url = new URL(website)
    return url.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

/** Google's free public favicon service — supports any domain. */
function faviconUrl(domain: string, size: number): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size * 2}`
}

/**
 * Platform / portal logo block. Renders the Google favicon if the provider
 * has a website; falls back to the monospace short-label badge otherwise.
 *
 * Used everywhere we list integration providers (publish wizard steps,
 * standalone publish page, integrations admin, marketing).
 */
export function PlatformLogo({
  provider,
  size = 40,
  className = '',
}: {
  provider: IntegrationProviderMeta
  size?: number
  className?: string
}) {
  const domain = domainOf(provider.website)
  const inner = Math.round(size * 0.7)

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-bone ${className}`}
      style={{ width: size, height: size }}
    >
      {domain ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl(domain, size)}
          alt=""
          width={inner}
          height={inner}
          className="object-contain"
          style={{ width: inner, height: inner }}
          loading="lazy"
        />
      ) : (
        <span className="font-mono text-[12px] font-medium text-ink">
          {provider.shortLabel}
        </span>
      )}
    </div>
  )
}
