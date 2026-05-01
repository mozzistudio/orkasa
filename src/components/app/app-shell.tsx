'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { BottomTabBar } from './bottom-tab-bar'
import { MoreSheet } from './more-sheet'
import { Fab } from './fab'

/**
 * Responsive shell that wraps the authenticated dashboard.
 *
 * Desktop (md+):
 *   ┌──────────────────────────┐
 *   │ ┌─────┐ ┌──────────────┐ │
 *   │ │     │ │ topbar       │ │
 *   │ │ side│ ├──────────────┤ │
 *   │ │     │ │ main         │ │
 *   │ └─────┘ └──────────────┘ │
 *   └──────────────────────────┘
 *
 * Mobile (< md):
 *   ┌──────────────────────────┐
 *   │ topbar (page title only) │
 *   ├──────────────────────────┤
 *   │ main (full width)        │
 *   │                          │
 *   ├──────────────────────────┤
 *   │ [📊][🏘][👥][📈][≡]      │ bottom tab bar
 *   └──────────────────────────┘
 *
 *   "Más" tab opens a slide-up sheet with secondary nav + user info + logout.
 */
export function AppShell({
  user,
  children,
}: {
  user: { fullName: string; role: string; email: string }
  children: React.ReactNode
}) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-paper">
      {/* Sidebar — visible on desktop only */}
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>

      {/* Main column */}
      <div className="flex flex-1 flex-col md:ml-60">
        <Topbar />
        <main
          className="flex-1 px-4 py-4 md:px-6 md:py-6"
          style={{
            // Bottom padding for mobile tab bar (h-14 = 56px) + iOS safe area
            paddingBottom:
              'calc(56px + env(safe-area-inset-bottom, 0px) + 1rem)',
          }}
        >
          {children}
        </main>
      </div>

      {/* FAB — mobile only, listing pages */}
      <Fab />

      {/* Bottom tab bar — mobile only */}
      <BottomTabBar onOpenMore={() => setMoreOpen(true)} />

      {/* "Más" sheet — mobile only */}
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        user={user}
      />
    </div>
  )
}
