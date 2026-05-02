/**
 * Generates SVG icons in the Orkasa logo's geometric style using Gemini.
 *
 * Run:
 *   pnpm dlx tsx scripts/generate-icons.ts             # generate all icons
 *   pnpm dlx tsx scripts/generate-icons.ts sidebar     # only the sidebar set
 *   pnpm dlx tsx scripts/generate-icons.ts home leads  # specific icons
 *
 * Outputs:
 *   src/components/icons/<name>.svg                    # raw SVG file
 *   src/components/icons/index.ts                       # auto-generated React exports
 */

import { GoogleGenAI } from '@google/genai'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Minimal .env.local parser — avoids adding a dotenv dependency.
function loadEnvLocal(): void {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq < 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = value
    }
  } catch {
    // .env.local is optional
  }
}
loadEnvLocal()

const OUT_DIR = join(ROOT, 'src/components/icons')

// =============================================================================
// Logo style reference — kept verbatim from src/components/ui/logo.tsx
// so Gemini sees the actual primitive shapes used in the brand mark.
// =============================================================================
const LOGO_SVG = `<svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M40 44 L160 56 L156 156 L46 164 Z" fill="none" stroke="currentColor" stroke-width="6"/>
  <rect x="86" y="94" width="36" height="36" fill="#FF4F1F"/>
</svg>`

// =============================================================================
// Style brief — sent with every icon prompt. This is the design system spec.
// =============================================================================
const STYLE_BRIEF = `
You are designing icons for Orkasa, a real estate CRM. The brand mark is an
off-axis quadrilateral (slightly tilted trapezoid, NOT a perfect rectangle)
outlined in a single stroke, with one solid signal-orange square inset.

Design rules — every icon must follow these:

1. ViewBox: 0 0 24 24
2. Stroke: 1.5px, stroke="currentColor", fill="none" for outlined shapes.
   Use stroke-linecap="round" and stroke-linejoin="round" only when the shape
   needs softening; default to no linecap (sharp corners) to match the brand mark.
3. The QUADRILATERAL motif: every icon should incorporate a slightly off-axis
   shape (subtle perspective tilt, asymmetric corners ±2px from a perfect grid).
   No perfectly axis-aligned rectangles unless the symbol absolutely demands it.
4. ONE signal-orange accent per icon — a small solid square (typically 4-6px)
   filled with #FF4F1F (no stroke). Place it where it carries semantic weight
   (e.g., the "active" indicator on a chart, the "alert" dot on a bell, the
   center mark on a target). Never more than one orange element per icon.
5. Geometric primitives only: paths, rects, lines, circles. NO text, NO fills
   on outlined shapes, NO gradients, NO filters, NO patterns.
6. Composition fits visually inside a ~20×20 area centered in the 24×24 viewBox
   — leave 2px breathing room on every side.
7. Shapes should feel hand-drawn but precise — slightly off-grid, never sloppy.

Brand mark for reference (this is the logo):

${LOGO_SVG}

Output format — strictly:
- Return ONLY the SVG markup, nothing else. No markdown fence, no explanation,
  no leading/trailing whitespace.
- Start with "<svg" and end with "</svg>".
- Must include viewBox="0 0 24 24" and xmlns="http://www.w3.org/2000/svg".
- Must include exactly one element with fill="#FF4F1F" (the orange accent).
- All other shapes must use stroke="currentColor" fill="none".
`.trim()

// =============================================================================
// Icon spec — every icon Gemini will generate, grouped by surface.
// Each entry: name (kebab-case), semantic intent, surface label.
// =============================================================================
type IconSpec = {
  name: string
  intent: string
  surface: 'sidebar' | 'property' | 'dashboard' | 'common'
}

const ICONS: IconSpec[] = [
  // Sidebar nav — 9 icons
  { name: 'home', intent: 'Home / dashboard. A house silhouette OR a 4-quadrant grid.', surface: 'sidebar' },
  { name: 'building', intent: 'A multi-story building viewed slightly from below. Used for "Propiedades" (properties).', surface: 'sidebar' },
  { name: 'people', intent: 'Two stylized people figures (head + shoulders) overlapping. Used for "Leads".', surface: 'sidebar' },
  { name: 'agent', intent: 'A single person figure with a small check mark badge. Used for "Agentes" (team).', surface: 'sidebar' },
  { name: 'analytics', intent: 'A bar chart with 3 vertical bars of varying heights. The orange accent is the tallest bar tip.', surface: 'sidebar' },
  { name: 'shield', intent: 'A shield/badge outline. Used for "Cumplimiento" (compliance). Orange accent inside.', surface: 'sidebar' },
  { name: 'plug', intent: 'An electrical plug with two prongs. Used for "Integraciones" (third-party integrations).', surface: 'sidebar' },
  { name: 'settings', intent: 'A gear with 6-8 teeth. Used for "Configuración".', surface: 'sidebar' },
  { name: 'logout', intent: 'A door with an arrow exiting through it.', surface: 'sidebar' },

  // Property card actions — 6 icons
  { name: 'share', intent: 'Three connected dots forming a triangular share/network glyph.', surface: 'property' },
  { name: 'arrow-down', intent: 'A downward arrow inside a rounded square (used for "lower price").', surface: 'property' },
  { name: 'star', intent: 'A 5-point star outline with the orange accent at the center.', surface: 'property' },
  { name: 'eye', intent: 'An eye shape (lens + pupil). Pupil is the orange square.', surface: 'property' },
  { name: 'bell', intent: 'A notification bell with a small orange dot at the bottom-right.', surface: 'property' },
  { name: 'refresh', intent: 'Two curved arrows forming a rotation cycle.', surface: 'property' },

  // Dashboard panels — 8 icons
  { name: 'calendar', intent: 'A calendar grid with one day cell highlighted in orange.', surface: 'dashboard' },
  { name: 'document', intent: 'A document/page with a folded corner.', surface: 'dashboard' },
  { name: 'pen', intent: 'A pen tilted at an angle (writing/signing).', surface: 'dashboard' },
  { name: 'snowflake', intent: 'A 6-arm snowflake with the orange accent in the center.', surface: 'dashboard' },
  { name: 'message', intent: 'A speech bubble with a small tail.', surface: 'dashboard' },
  { name: 'trending-up', intent: 'A jagged line going up-right with an arrowhead.', surface: 'dashboard' },
  { name: 'trending-down', intent: 'A jagged line going down-right with an arrowhead.', surface: 'dashboard' },
  { name: 'archive', intent: 'A box/archive container with a horizontal lid line.', surface: 'dashboard' },

  // Common UI — 7 icons
  { name: 'plus', intent: 'A plus / add symbol.', surface: 'common' },
  { name: 'upload', intent: 'An upward arrow above a horizontal line (upload to cloud).', surface: 'common' },
  { name: 'search', intent: 'A magnifying glass.', surface: 'common' },
  { name: 'sliders', intent: 'Two horizontal sliders/filter bars with knobs.', surface: 'common' },
  { name: 'grid-view', intent: 'A 2x2 grid of small squares — one is the orange accent.', surface: 'common' },
  { name: 'list-view', intent: 'Three horizontal lines stacked.', surface: 'common' },
  { name: 'chevron-down', intent: 'A downward chevron arrow.', surface: 'common' },
]

// =============================================================================
// Gemini call
// =============================================================================
async function callModel(
  client: GoogleGenAI,
  model: string,
  prompt: string,
): Promise<string> {
  const response = await client.models.generateContent({ model, contents: prompt })
  return response.text ?? ''
}

const MODEL_PRIMARY = 'gemini-2.5-pro'
const MODEL_FALLBACK = 'gemini-2.5-flash'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function generateIconSvg(client: GoogleGenAI, spec: IconSpec): Promise<string> {
  const prompt = `${STYLE_BRIEF}

Now design the icon for: "${spec.name}"
Semantic intent: ${spec.intent}
Surface: ${spec.surface}

Output the SVG now.`

  let text = ''
  let lastError: unknown = null
  for (const model of [MODEL_PRIMARY, MODEL_FALLBACK]) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        text = await callModel(client, model, prompt)
        if (text) break
      } catch (e) {
        lastError = e
        const msg = (e as { message?: string }).message ?? String(e)
        const overloaded = msg.includes('UNAVAILABLE') || msg.includes('503')
        const rateLimited = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')
        if (!overloaded && !rateLimited) throw e
        // Backoff before retry: 2s, 4s, 8s
        await sleep(2_000 * Math.pow(2, attempt))
      }
    }
    if (text) break
  }

  if (!text) {
    throw new Error(
      `Both models exhausted for "${spec.name}": ${(lastError as Error)?.message ?? 'unknown'}`,
    )
  }

  const cleaned = text
    .replace(/^```(?:svg|xml)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  if (!cleaned.startsWith('<svg') || !cleaned.endsWith('</svg>')) {
    throw new Error(
      `Invalid SVG response for "${spec.name}": ${text.slice(0, 200)}...`,
    )
  }
  return cleaned
}

// =============================================================================
// Validation — reject icons that miss the style rules
// =============================================================================
function validateSvg(svg: string, name: string): string[] {
  const issues: string[] = []
  if (!svg.includes('viewBox="0 0 24 24"')) {
    issues.push('missing viewBox="0 0 24 24"')
  }
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    issues.push('missing xmlns')
  }
  const orangeMatches = svg.match(/fill="#FF4F1F"/gi) ?? []
  if (orangeMatches.length === 0) {
    issues.push('no orange accent (#FF4F1F)')
  } else if (orangeMatches.length > 1) {
    issues.push(`${orangeMatches.length} orange elements (max 1)`)
  }
  if (!svg.includes('currentColor')) {
    issues.push('no currentColor stroke')
  }
  if (svg.includes('<text')) {
    issues.push('contains <text> (not allowed)')
  }
  if (issues.length > 0) {
    console.warn(`  ⚠ ${name}: ${issues.join(', ')}`)
  }
  return issues
}

// =============================================================================
// React index generation
// =============================================================================
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('')
}

function writeReactIndex(generated: string[]): void {
  const exports = generated
    .map((name) => {
      const Comp = `${toPascalCase(name)}Icon`
      return `export { default as ${Comp} } from './${name}.svg'`
    })
    .join('\n')

  const componentExports = generated
    .map((name) => {
      const Comp = `${toPascalCase(name)}Icon`
      const importPath = `./${name}.svg`
      return `// import { ReactComponent as ${Comp} } from '${importPath}'`
    })
    .join('\n')

  const content = `// Auto-generated by scripts/generate-icons.ts
// Do not edit by hand — re-run the script to regenerate.
//
// Usage in a React component:
//   import { HomeIcon } from '@/components/icons'
//   <HomeIcon className="h-4 w-4" />

${exports}

// SVG-as-component fallback (if your bundler doesn't auto-handle .svg imports):
${componentExports}
`
  writeFileSync(join(OUT_DIR, 'index.ts'), content, 'utf8')
}

// =============================================================================
// Main
// =============================================================================
async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY missing from .env.local')
    process.exit(1)
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  // Args: filter to a surface or specific names
  const args = process.argv.slice(2)
  let pending: IconSpec[] = ICONS
  if (args.length > 0) {
    const surfaces = ['sidebar', 'property', 'dashboard', 'common']
    if (args.length === 1 && surfaces.includes(args[0])) {
      pending = ICONS.filter((i) => i.surface === args[0])
    } else {
      pending = ICONS.filter((i) => args.includes(i.name))
    }
  }

  if (pending.length === 0) {
    console.error(`No icons match: ${args.join(', ')}`)
    process.exit(1)
  }

  const client = new GoogleGenAI({ apiKey })
  console.log(`Generating ${pending.length} icon${pending.length === 1 ? '' : 's'}...`)
  console.log()

  const generated: string[] = []
  for (const spec of pending) {
    process.stdout.write(`  ${spec.name.padEnd(18)} `)
    try {
      const svg = await generateIconSvg(client, spec)
      validateSvg(svg, spec.name)
      writeFileSync(join(OUT_DIR, `${spec.name}.svg`), svg, 'utf8')
      generated.push(spec.name)
      console.log('✓')
    } catch (e) {
      console.log(`✗ ${(e as Error).message}`)
    }
    // Tiny pacing delay so we don't hammer the model
    await sleep(500)
  }

  // Re-read all existing icon names so the index stays complete after partial runs
  const allExisting = ICONS.filter((i) =>
    existsSync(join(OUT_DIR, `${i.name}.svg`)),
  ).map((i) => i.name)
  writeReactIndex(allExisting)

  console.log()
  console.log(
    `Done. ${generated.length}/${pending.length} generated. Output: ${OUT_DIR}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
