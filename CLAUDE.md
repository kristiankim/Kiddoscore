# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Run production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests
- `npm run test:ui` - Run Vitest with UI

## Architecture

**Framework:** Next.js 14 with App Router, TypeScript, and Tailwind CSS

**Data Storage:** Hybrid localStorage/Supabase architecture:
- `app/_lib/storage.ts` - Main storage abstraction layer that conditionally uses Supabase or localStorage
- `app/_lib/supabase-storage.ts` - Supabase-specific implementations  
- Storage backend determined by environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Uses individual CRUD operations (`addKid`, `updateKid`, `removeKid`, etc.) for Supabase compatibility
- `toggleCompletion` function handles task completion tracking for both storage backends

**Key Data Types (`app/_lib/types.ts`):**
- `Kid` - Child profiles with points
- `Task` - Available tasks with point values and optional kid assignments
- `Reward` - Redeemable rewards with costs
- `Redemption` - Reward redemption history
- `Completions` - Nested object tracking daily task completions: `{date: {kidId: {taskId: boolean}}}`

**State Management:** React Context (`app/_lib/context.tsx`) provides:
- Current selected kid
- All app data (kids, tasks, rewards, completions, redemptions)
- CRUD operations for all entities

**Page Structure:**
- `/` - Child home page with task checklist and points
- `/rewards` - Reward redemption with confirmation dialog
- `/parent` - Protected parent dashboard (passcode required)

**Component Architecture:**
- Components in `app/_components/` are reusable UI elements
- Each page has its own `page.tsx` file
- Layout defined in `app/layout.tsx` with global Header and KidProvider

**Database Schema:** 
- Supabase tables: `kids`, `tasks`, `rewards`, `redemptions`, `completions`
- Schema defined in `supabase_schema.sql`
- Database types in `app/_lib/supabase.ts`

**Testing:** Vitest with Node environment, tests in `__tests__/` directory