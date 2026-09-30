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

## Design Context

### Users
**Kids (primary):** Children completing daily chores and tasks. They use the app briefly each day as part of a household routine — checking off tasks, watching points accumulate, and redeeming rewards. The experience should feel easy and satisfying, not demanding.

**Parents (secondary):** Adults managing the system — adding kids, configuring tasks and rewards, reviewing progress. They need clarity and control, not entertainment.

### Brand Personality
**Playful, warm, encouraging.**

Sparkquest should feel like a trusted companion for building good habits — not a game that demands attention, and not a cold productivity tool. It celebrates progress gently. It never feels stressful. Kids open it because it feels good to check things off, not because it's the flashiest app on the device.

Tone: friendly and supportive. Never sarcastic, never harsh. Quiet delight over loud celebration.

### Aesthetic Direction
**Reference:** Headspace / Calm — soft, warm, rounded. Gentle and reassuring rather than bold or high-energy.

**Visual tone:**
- Rounded shapes (2xl corners) throughout, soft shadows, no hard edges
- Indigo brand (`hsl(250 75% 55%)`) as the primary accent — calm and trustworthy
- Warm off-white backgrounds, not stark white
- No glass morphism — flat, clean surfaces only
- Geist Sans throughout headings, body text, and controls keeps the app clear and consistent
- Confetti and float animations stay subtle — joy on completion, not overwhelming
- **Both light and dark mode** — light mode uses warm off-whites and soft indigo; dark mode should feel cozy and deep (warm dark navy, not pure black `#0a0a0a`)

**Anti-references:** Avoid anything that looks like a game notification system (aggressive streaks, red urgency badges, constant nudges). Avoid stark corporate minimalism. Avoid loud rainbow palettes.

### Design Principles

1. **Calm over hype** — Celebrate progress with restraint. Animations should feel like a breath, not a firework. Every delight moment should be earned, not constant.

2. **Routine-first clarity** — The daily check-in should take 30 seconds. Task states (done/not done), point totals, and what to do next must be immediately obvious without reading.

3. **Dual-audience harmony** — Child screens prioritize warmth and ease; parent screens prioritize structure and control. Both share the same soft palette and rounded forms — just different density and tone.

4. **Warmth in the details** — Indigo avatars, soft colored badges, gentle hover states. Small moments of warmth make the app feel cared for, not auto-generated.

5. **Dark mode is cozy, not stark** — In dark mode, use deep warm navy (`~220 25% 10%`) as the base rather than pure black. Surfaces should feel layered, not flat.