# Orkasa

AI-native real estate OS for LATAM. Built with the Swiss Minimal design system.

## Stack

- **Framework**: Next.js 15 (App Router, RSC, TypeScript strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui (reskinned)
- **Database**: Supabase (auth, Postgres, storage)
- **i18n**: next-intl (es/en, default es)
- **Forms**: React Hook Form + Zod
- **Server state**: TanStack Query
- **Icons**: Lucide React (stroke 1.5)

## Setup

```bash
pnpm install
cp .env.local.example .env.local  # fill in credentials
pnpm dev
```

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (server only) |
| `ANTHROPIC_API_KEY` | No | Anthropic API key for AI features |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (http://localhost:3000 for dev) |
