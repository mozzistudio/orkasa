'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Antes',
  afterLabel = 'Después',
  aspect = 'aspect-[4/3]',
}: {
  beforeUrl: string
  afterUrl: string
  beforeLabel?: string
  afterLabel?: string
  aspect?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [position, setPosition] = useState(50)

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, pct)))
  }, [])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return
      updateFromClientX(e.clientX)
    }
    function onTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return
      const t = e.touches[0]
      if (!t) return
      updateFromClientX(t.clientX)
      e.preventDefault()
    }
    function onUp() {
      draggingRef.current = false
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    window.addEventListener('touchcancel', onUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('touchcancel', onUp)
    }
  }, [updateFromClientX])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowLeft') {
      setPosition((p) => Math.max(0, p - 5))
      e.preventDefault()
    } else if (e.key === 'ArrowRight') {
      setPosition((p) => Math.min(100, p + 5))
      e.preventDefault()
    }
  }

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={0}
      aria-label="Comparar antes y después"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(position)}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        draggingRef.current = true
        updateFromClientX(e.clientX)
      }}
      onTouchStart={(e) => {
        draggingRef.current = true
        const t = e.touches[0]
        if (t) updateFromClientX(t.clientX)
      }}
      className={`relative w-full ${aspect} cursor-col-resize select-none overflow-hidden rounded-[3px] bg-bone outline-none focus-visible:ring-2 focus-visible:ring-signal/60`}
    >
      {/* Before image — full layer */}
      <Image
        src={beforeUrl}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="pointer-events-none object-cover"
        draggable={false}
      />
      {/* After image — clipped from `position%` to the right */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      >
        <Image
          src={afterUrl}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="pointer-events-none object-cover"
          draggable={false}
        />
      </div>

      {/* Labels */}
      <span className="absolute left-2 top-2 rounded-[3px] bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-ink">
        {beforeLabel}
      </span>
      <span className="absolute right-2 top-2 rounded-[3px] bg-signal px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-paper">
        {afterLabel}
      </span>

      {/* Divider line */}
      <div
        className="pointer-events-none absolute bottom-0 top-0 w-[2px] bg-paper"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />

      {/* Drag handle */}
      <div
        className="pointer-events-none absolute top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-bone bg-paper"
        style={{ left: `${position}%` }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink"
        >
          <path d="M9 6 L4 12 L9 18 M15 6 L20 12 L15 18" />
        </svg>
      </div>
    </div>
  )
}
