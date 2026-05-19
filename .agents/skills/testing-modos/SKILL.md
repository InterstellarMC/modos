---
name: testing-modos
description: End-to-end test MODOS (the AI-native Reddit moderation OS). Use when verifying any MODOS surface or before recording a demo. All UI numbers are pinned by the deterministic seed, so an adversarial test plan can assert exact values.
---

# Testing MODOS end-to-end

MODOS is a Devvit webview app with five surfaces (Mission Control, AI Queue,
Raid Radar, NL Rules, Mod Memory) plus a `⌘K` command palette. The reasoning
engine, seed, and rule compiler all run client-side, so the same bundle that
runs inside Reddit's iframe also runs as a pure-browser preview — use that for
fast iteration.

## Where to test

- **Pure-browser preview** (fast, no Reddit account needed):
  - Deploy: `npm run build:client && deploy frontend dir=dist/web`
  - This deploys the React bundle to a devinapps.com subdomain. It exercises
    the real reasoning engine + seed; only Devvit-server endpoints are stubbed.
  - Existing preview at the time of writing: https://dist-web-sexzdesc.devinapps.com
- **Devvit dev server** (full Reddit context):
  - `npm run dev:devvit` (logs in via `devvit login`)
  - Requires a test subreddit; see `devvit.json` for the app slug.

## Run order before each test

```bash
cd ~/repos/modos
npm install         # idempotent
npm run lint        # eslint
npm run type-check  # tsc --noEmit
npm run build       # vite client + esbuild server
```

All three must succeed before testing. The repo has no CI configured, so this
is the only gate.

## Seed values to assert against

Every visible number in the UI is pinned by `src/shared/seed.ts`. If any of
these drift, the seed was changed — inspect `seed.ts` before assuming a bug.

| Surface | Seed values you can assert verbatim |
|---|---|
| Mission Control | `r/example`, `248.9K subs`, `14 mods`, metrics `24 / 312 / 3h 4m / 0.1`, risk dist `CRITICAL 8 · HIGH 3 · MED 1 · LOW 12`, top signals `New account 11 · Toxic language 9 · Promotional CTA 5 · User reports 27` |
| AI Queue | `24 pending`, filters `All 24 · Critical 8 · High 3 · Medium 1 · Low 12`. First CRITICAL is `u/taco_tuesday` with signals `Self-harm directive +0.95 · Personal insult +0.35 · 1 user report +0.08`, scored `1.00` with `confidence 95%`. |
| Raid Radar | Header `Incident · Coordinated influx from r/example_brigade`, `142 accounts`, stats `549 · 284 · 48/min · 34%`, 4-series chart, 5-item playbook, 5-event timeline with severities `HIGH · CRITICAL · HIGH · HIGH · MEDIUM`. |
| NL Rules | 3 active seed rules. Compiling the first sample prompt (`Flag posts from accounts under…`) matches **7** queue items — a working compiler will never return 0 here. |
| Mod Memory | `u/rage_qu1t` profile: `124 day account · 318 karma · REMOVAL RATE 42% · WARNINGS 4 · PRIOR BANS 2`. 4 seed mod notes total, including one from `u/mod_mentor` with tags `BRIGADING / RULE-4`. |

## Adversarial assertions that catch real bugs

These are the assertions that would visibly fail under common regressions:

1. **Tone-routing in `draftRemoval()`** — the 3 tones MUST produce strictly
   different prefixes and closings (broken branch → identical text):
   - Neutral: `Hi,` … `If you believe this was a mistake, please reply via modmail and a moderator will review.`
   - Firm: `Removed.` … `Repeated violations may result in a temporary ban. You can appeal via modmail.`
   - Friendly: `Hey there — thanks for posting.` … `You are welcome to revise and try again. If you think this was a mistake, reply via modmail and a human mod will review.`
2. **Bulk-remove dispatch** — `Remove all critical` should drop `All 24 → 16` and
   `Critical 8 → 0` and emit 8 `Removed · response sent` toasts. A broken store
   wiring would either no-op or remove only one item.
3. **Rule compile** — generous prompts must return `matched N` with N > 0. The
   first sample prompt returns exactly 7 in the current seed.
4. **Memory note persistence** — saving a note increments `Notes & history` and
   ALSO appears in the `ALL MOD NOTES` right column (two distinct lists, same
   store).
5. **⌘K palette filter + dispatch** — typing `crit` should filter to exactly
   `Triage · Remove all CRITICAL items` and pressing Enter must close the modal
   AND fire the bulk-remove action (look for the toast — the queue count won't
   change if there are 0 critical left).

## Recording the cinematic demo

- Maximize Chrome first: `wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`
- Start a recording, then walk one continuous flow:
  Mission Control → AI Queue (click first CRITICAL) → cycle Neutral/Firm/Friendly
  tones → `Remove all critical` → Raid Radar → NL Rules (click sample +
  compile) → Mod Memory (`u/rage_qu1t`, save a note) → `Ctrl+K` → type `crit`
  → Enter.
- Use `annotate_recording` heavily: one `test_start` per surface, one
  `assertion` per high-signal check. The video slows down at annotations,
  which is what makes the demo readable.
- For the seeded test plan and pass/fail report format, see
  `docs/TEST_PLAN.md` and `docs/test-results/test-report.md`.

## Known gotchas

- **Devvit Vite plugin will break `vite dev`** if the project isn't running
  inside Devvit. `vite.config.ts` already gates the plugin on the
  `MODOS_WEB=1` env var — use `MODOS_WEB=1 npm run dev:web` for the pure-browser
  dev loop.
- **Right-side action buttons in the queue (Approve / Escalate / Remove)** sit
  below the fold on 1024-tall screens. They are in the DOM (you'll see
  `offscreen=""` in the annotated DOM) but you need to scroll the detail panel
  to click them. The bulk `Remove all critical` button is always visible and
  is the safer button to use for state-change assertions.
- **CommandPalette filter is case-insensitive** and matches against the
  command label only — typing the section name (`triage`) returns multiple
  commands; typing `crit` returns exactly one.
- **Mod notes are stored client-side** (Zustand store), so a page refresh
  clears them in the preview build. Inside the real Devvit runtime they're
  persisted through the Hono routes in `src/server/routes/api.ts` against
  Redis.

## Devin secrets needed

None. The preview deployment requires no auth, and the Devvit dev server
uses your already-logged-in `devvit` CLI session.
