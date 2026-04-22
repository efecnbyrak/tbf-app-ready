# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**BKS — Basketbol Koordinasyon Sistemi** is a full-stack web app for the Turkish Basketball Federation. It manages referee/official availability, match assignments, announcements, exams, and admin operations.

## Commands

```bash
npm run dev          # Start local dev server (localhost:3000)
npm run build        # Production build
npm run start        # Run production build locally
npm run lint         # ESLint check
npm run db:push      # Push Prisma schema to DB (no migration files)
npm run db:seed      # Seed the database (tsx prisma/seed.ts)
npx prisma studio    # Visual DB browser
npx prisma generate  # Regenerate Prisma client after schema changes
```

Required env vars (see `.env.local`): `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `SMTP_USER`, `SMTP_PASS`, `OPENAI_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`, `BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_APP_URL`.

`SMTP_PASS` must be a **Gmail App Password** (16-char), not the regular account password.

## Architecture

### Auth & Sessions
- JWT-based sessions via `lib/session.ts` using `jose`. Session stored in `session` cookie.
- `verifySession()` is called at the top of every server component / action — it `redirect("/")` on failure, never throws.
- Roles stored in JWT: `SUPER_ADMIN`, `ADMIN`, `ADMIN_IHK`, `OBSERVER`, `REFEREE`, `TABLE`, `HEALTH`, `STATISTICIAN`, `FIELD_COMMISSIONER`.
- Admin roles for permission checks: `["SUPER_ADMIN", "ADMIN", "ADMIN_IHK", "OBSERVER"]`. **All four** must be included in `isAdmin`/`isObserverAndAdmin` arrays — a common source of bugs when adding new checks.

### Route Structure
- `/app/(auth)/` — login/register pages (no nav layout)
- `/app/admin/(dashboard)/` — admin panel; layout in `AdminLayoutClient.tsx` (sidebar). Settings page restricted to `SUPER_ADMIN` only.
- `/app/referee/` — referee panel; layout uses `RefereeNavWrapper` (server) → `ResponsiveNav` (client).
- `/app/general/` — general officials panel; layout in `general/layout.tsx`.
- `/app/api/` — API routes (auth, matches, chat, cron, announcements).

### Two User Profile Types
Every logged-in user (`User`) can be linked to **either** a `Referee` or a `GeneralOfficial` record (never both). Code throughout the app does:
```ts
let profile = await db.referee.findUnique({ where: { userId } });
let isOfficial = false;
if (!profile) { profile = await db.generalOfficial.findUnique(...); isOfficial = true; }
```
The `GeneralOfficial.officialType` field uses **English enum strings** in the DB: `"TABLE"`, `"OBSERVER"`, `"HEALTH"`, `"STATISTICIAN"`, `"FIELD_COMMISSIONER"`, `"TABLE_STATISTICIAN"`, `"TABLE_HEALTH"`. Never compare against Turkish display strings.

### Availability System
Core logic lives in `lib/availability-utils.ts` → `getAvailabilityWindow()`. It returns `{ startDate, endDate, deadline, openTime, isLocked, mode, weekNumber }`.

**Key settings** (stored in `system_settings` DB table):
| Key | Description |
|-----|-------------|
| `AVAILABILITY_TARGET_DATE` | ISO date of the target Saturday |
| `AVAILABILITY_TARGET_MANUAL` | `"true"` = admin set date manually, skip auto-rollover |
| `AVAILABILITY_MODE` | `"AUTO"` / `"OPEN"` / `"CLOSED"` |
| `CURRENT_WEEK_NUMBER` | Integer week counter |
| `LAST_WEEK_ROLLOVER_DATE` | `YYYY-MM-DD` of last Monday rollover |

Auto-rollover advances `TARGET_DATE` by 7 days when today is past Tuesday 20:30 — **disabled** when `AVAILABILITY_TARGET_MANUAL = "true"`. Manual flag is set when admin saves settings and cleared when admin clicks "Sistemi İlerlet".

### Server Actions Pattern
All mutations use Next.js Server Actions in `app/actions/`. They always:
1. Call `verifySession()` first
2. Check role permissions
3. Return `{ success: true }` or `{ error: "..." }`

There is **no standardized response type** — some return `data`, others don't. Check the specific action before calling from client.

### Database
- Prisma with PostgreSQL. Schema at `prisma/schema.prisma`.
- `lib/db.ts` exports a singleton `db` client with Prisma extensions for Turkish name localization.
- `lib/db-heal.ts` runs `ensureSchemaColumns()` on every request from referee layout — it adds missing DB columns and generates recovery codes. Avoid calling it more than necessary.
- `strictNullChecks: false` in `tsconfig.json` — TypeScript will NOT catch null/undefined access errors. Be defensive with optional chaining and null checks manually.

### Match Store (Caching)
Match assignments for each user are cached in `User.matchStore` (JSON column) via `lib/matches-store.ts`. Updated by cron/admin import, read by `getUpcomingUserMatches()`. Not a real-time source — reflects last sync.

### Email
`lib/email.ts` exports `sendEmailSafe()` and specific helpers. All go through `nodemailer` with Gmail SMTP. If `SMTP_USER`/`SMTP_PASS` are unset, it logs a simulation and returns `true` (no crash). Email failures are non-blocking — availability form save still succeeds.

### AI Features
- `lib/ai/reffai.ts` — Document search combining Pinecone vector search + OpenAI GPT for referee rule queries.
- `app/api/chat/` — General chat API using OpenAI streaming.

### Excel Export
`app/admin/(dashboard)/all-availabilities/export/route.ts` — generates `.xlsx` with ExcelJS. Phone numbers are formatted via `formatPhone()` (handles 10, 11, 12-digit Turkish formats). `wrapText` is disabled for name/type/class/phone columns to prevent cell overflow.

## Key Conventions

- **Role checks** — use arrays, not `||` chains: `["ADMIN", "SUPER_ADMIN", "ADMIN_IHK", "OBSERVER"].includes(session.role)`.
- **revalidatePath** — call after every mutation that changes visible data. Common paths: `/referee/availability`, `/admin/settings`, `/admin/all-availabilities`.
- **`export const dynamic = 'force-dynamic'`** — add to any page that reads live DB data and must not be cached.
- **Server components** use `async/await` directly. Client components are marked `"use client"` and use hooks + server actions for mutations.
- **Tailwind** — project uses Tailwind v4 with `@tailwindcss/postcss`. Class order doesn't matter but dark mode classes (`dark:`) are used throughout.
