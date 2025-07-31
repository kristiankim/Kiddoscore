# Sparkquest

A mobile-first web app for tracking kids' tasks with points and rewards redemption.

## Setup

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Run tests:
```bash
npm run test
```

Build and start production:
```bash
npm run build && npm start
```

## Features

- **Child Home (/)**: Daily task checklist with point tracking
- **Rewards (/rewards)**: Redeem points for rewards with confirmation
- **Parent Settings (/parent)**: Protected CRUD for kids, tasks, and rewards

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- LocalStorage persistence
- Vitest for testing

## Usage

1. Visit the app - demo data loads automatically
2. Switch between kids using the header buttons
3. Complete tasks to earn points
4. Redeem rewards (with confetti animation!)
5. Access parent settings with passcode (set on first visit)

## Data Model

All data persists in localStorage with these collections:
- `kids`: Kid profiles with points
- `tasks`: Available tasks with point values
- `rewards`: Redeemable rewards with costs
- `completions`: Daily task completion tracking
- `redemptions`: Reward redemption history

## Parent Features

- Manage kids, tasks, and rewards
- Adjust kid points (+/-)
- Clear today's completions per kid
- Start new week (clears completions, keeps points)
- View weekly progress stats

The app is fully self-contained with no backend required.