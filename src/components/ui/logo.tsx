import { cn } from '@/lib/utils'

export function LogoMark({
  className,
  size = 32,
}: {
  className?: string
  size?: number
}) {
  const strokeWidth = size <= 24 ? 12 : size <= 40 ? 10 : 6
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Orkasa"
    >
      <path
        d="M40 44 L160 56 L156 156 L46 164 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <rect x="86" y="94" width="36" height="36" fill="var(--signal)" />
    </svg>
  )
}

export function LogoLockup({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-8', className)}
      aria-label="Orkasa"
    >
      <path
        d="M20 26 L88 32 L86 90 L24 96 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
      />
      <rect x="46" y="54" width="18" height="18" fill="var(--signal)" />
      <text
        x="108"
        y="78"
        fontFamily="var(--font-sans)"
        fontWeight="500"
        fontSize="48"
        letterSpacing="-2"
        fill="currentColor"
      >
        orkasa
      </text>
    </svg>
  )
}
