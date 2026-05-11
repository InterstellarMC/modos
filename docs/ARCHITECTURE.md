# MODOS — Architecture

## Goals

- **One bundle, no surprises.** A single React app served by Devvit.
- **0 ms reasoning.** Everything that scores or matches is deterministic and
  runs locally. Real model inference can be plugged in behind the same
  interface later.
- **Always demo-ready.** A deterministic seed makes the crisis scenario
  reproducible across cold installs.
- **Type-safe across client/server.** All domain types live in
  `src/shared/types.ts`.

## High-level diagram

```
            ┌──────────────────────────────┐
            │   Reddit iframe (Devvit)     │
            │                              │
            │  splash.html  console.html   │
            │       │            │         │
            │       └─React 19 + Tailwind 4┘
            │                ▲             │
 webview ── │ fetch /api/*   │ navigateTo  │
            │                ▼             │
            │   src/server (Hono · Node22) │
            │                              │
            │   routes/api   ◀───┐         │
            │   routes/menu      │         │
            │   routes/triggers  │         │
            │       │            │         │
            │       ▼            │         │
            │   core/store.ts ───┘         │
            │       │                      │
            │       ▼                      │
            │   Redis (modos:*)            │
            │                              │
            │   shared/reasoning.ts        │
            │   shared/seed.ts             │
            └──────────────────────────────┘
```

## Module map

### `src/shared`

| File | Responsibility |
| --- | --- |
| `types.ts` | All domain types: `RiskLevel`, `QueueItem`, `RaidIncident`, `ModRule`, `MemoryNote`, `UserProfile`, request/response envelopes. |
| `reasoning.ts` | Deterministic risk scorer, removal-draft generator, NL rule compiler. |
| `seed.ts` | Deterministic seed of 24 queue items, raid incident with 28-point time series, 3 rules, 4 mod notes, 4 user profiles, overview metrics. |

### `src/client`

| File | Responsibility |
| --- | --- |
| `App.tsx` | Root shell. Mounts router, command palette, toasts. Boots state. |
| `console.tsx`/`console.html` | Devvit expanded entrypoint. |
| `splash.tsx`/`splash.html` | Devvit inline entrypoint. |
| `components/Sidebar.tsx` | Persistent left nav with risk badges and shortcuts. |
| `components/Topbar.tsx` | Subreddit context, incident status, command-palette opener. |
| `components/CommandPalette.tsx` | ⌘K palette. |
| `components/Toasts.tsx` | Animated bottom-right toasts. |
| `components/RiskBadge.tsx` | Reusable risk pill. |
| `components/Sparkline.tsx` | Small SVG sparkline used in overview + memory. |
| `components/RaidChart.tsx` | Multi-series cinematic time chart. |
| `views/OverviewView.tsx` | Mission control dashboard. |
| `views/QueueView.tsx` | AI triage queue + detail panel + removal assistant. |
| `views/RaidView.tsx` | Raid Radar with auto-response and timeline. |
| `views/RulesView.tsx` | Natural-language rule composer + listing. |
| `views/MemoryView.tsx` | User profiles, notes, toxicity trend. |
| `state/store.ts` | `useSyncExternalStore` based store, all actions and selectors. |
| `lib/cn.ts` | `clsx` + `tailwind-merge`. |
| `lib/format.ts` | Relative time, number, duration, truncation helpers. |
| `lib/icons.tsx` | Hand-rolled SVG icon set. |
| `index.css` | Tailwind import + design tokens + animations. |

### `src/server`

| File | Responsibility |
| --- | --- |
| `index.ts` | Hono app. Mounts `/api` and `/internal` (menu, triggers). |
| `routes/api.ts` | REST surface (init, action, draft, score, rule, note, incident, profiles). |
| `routes/menu.ts` | Subreddit menu items (open console, seed demo). |
| `routes/triggers.ts` | `onAppInstall` bootstrap. |
| `core/store.ts` | Redis-backed persistence and seed fallback. |
| `core/post.ts` | Console post creation. |

## Data flow

1. Client mounts; `initApp()` calls `GET /api/init`.
2. The server either returns the persisted state (Redis) or seeds it.
3. Every mutation on the client (action, draft, rule, note) is applied
   optimistically and POSTed to the server.
4. When the server is unavailable (e.g. browser preview mode), the client
   continues running fully offline against the in-memory copy of the seed.

## Reasoning model

`assessItem(body, author, reportReasons)` returns a `RiskAssessment`:

- `score: 0..1`
- `level: critical | high | medium | low`
- `signals: { label, weight, evidence }[]`
- `recommendedAction: approve | remove | escalate | review`
- `confidence: 0..1`
- `isLikelyFalsePositive: boolean`

Signals are weighted patterns (TOXIC_PATTERNS, SPAM_PATTERNS, QUALITY_BONUS)
plus account-age/karma offsets. A signal's `evidence` field is what the UI
renders verbatim under each signal bar — there are no hidden numbers.

`draftRemoval(item, tone)` quotes the top positive signal and adapts the
opening line per tone. `matchRule(prompt, items)` extracts intent keywords
(`newAccount`, `toxic`, `spam`, `ban`, `political`, `repeat`) from a plain
English prompt and runs heuristic matching against pending items.

## Persistence keyspace

| Key | Type | Purpose |
| --- | --- | --- |
| `modos:queue` | JSON | Array of `QueueItem` |
| `modos:rules` | JSON | Array of `ModRule` |
| `modos:notes` | JSON | Array of `MemoryNote` |
| `modos:profiles` | JSON | Array of `UserProfile` |
| `modos:incident` | JSON | Current `RaidIncident` |
| `modos:overview` | JSON | `Overview` snapshot |
| `modos:timesaved` | int | Cumulative minutes saved |

## Why deterministic

The judging signal is "would Reddit launch this?" — so reproducibility
matters. Every screenshot, every demo, every PR review sees the *same*
brigading scenario, the *same* 24 queue items, the *same* sparkline shape.
That reliability is impossible with a stochastic LLM, and unnecessary for
the product surface MODOS is showing.

When MODOS goes from hackathon to production, the reasoning engine becomes
the *fallback* layer and a hosted model takes the primary slot — keeping
explainability and offline support intact.
