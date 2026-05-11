# MODOS — Devpost submission copy

## Title

**MODOS — the AI-native operating system for Reddit moderation**

## Tagline (Devpost short pitch, ≤200 chars)

Risk-scored queues, one-click removal drafts, real-time raid radar, plain-English rules, and a shared mod memory — the moderation console Reddit moderators have been waiting for.

## Elevator pitch (2–3 sentences)

MODOS is an AI-native moderation OS that lives inside Reddit. It replaces the chaos of report queues with a transparent, evidence-scored workflow that drafts removal responses, detects coordinated brigades the second they begin, lets mods write rules in plain English, and gives the entire mod team a shared memory of every decision — saving hours per moderator per week and dramatically reducing burnout.

---

## Inspiration

Reddit runs on the unpaid labor of about 60,000 volunteer moderators. We talked to mods of communities ranging from a few thousand to a few million subscribers, and the same five problems came up every single time:

1. The queue is faster than humans can read.
2. Removal reasons are repetitive and demoralizing.
3. Brigades and raids escalate in minutes; tooling reacts in hours.
4. Every team rediscovers the same problem users independently.
5. Configuration is buried in regex, YAML, and AutoMod folklore.

We've all watched a moderator quietly burn out from death-by-queue. MODOS exists because the work deserves a tool that respects the people doing it.

## What it does

MODOS is one console that gives a mod team **calm, signal-rich, AI-assisted moderation**. It ships with five connected surfaces:

- **Mission Control** — pending volume, time saved, top signals, weekly approvals vs removals, and the five items that need a decision right now.
- **AI Triage Queue** — every item scored 0.00–1.00 with a per-signal explanation of *why*, false-positive detection for high-trust users, and grouped clusters for coordinated content.
- **Removal Assistant** — one-click public reply + modlog note drafted in three tones (firm / neutral / friendly), referencing the actual signal that triggered the score.
- **Raid & Brigade Radar** — live multi-series chart, automatic crisis mode that holds new-account posts and pre-drafts removals, and a replayable incident timeline.
- **Natural-Language Rules** — describe a rule in English ("flag posts from accounts under 7 days old with toxic language") and MODOS compiles it on the spot, showing which pending items match.
- **Mod Memory** — a shared, searchable history of every decision, warning, prior ban, and mod note for every user the team has ever interacted with.

Plus a Linear-style ⌘K command palette so power-mods never have to touch the mouse.

## How we built it

- **Devvit** for the Reddit integration — inline splash post (`splash.html`), expanded console (`console.html`), subreddit menu items, and an `onAppInstall` trigger that bootstraps the demo scenario in zero clicks.
- **React 19 + Tailwind CSS 4** for a premium dark UI built around tokens we defined as `@theme` variables.
- **Hono** for a tiny serverless API surface on Devvit's Node 22 runtime.
- **Redis** (via `@devvit/web/server`) for persistence, with the `modos:*` keyspace and an automatic fallback to a deterministic seed.
- **A custom local reasoning engine** in `src/shared/reasoning.ts` that scores items, drafts removals, and matches natural-language rules — all deterministic, fast, and private. Designed to slot in a hosted LLM later without changing the product surface.
- **A deterministic crisis seed** so the demo is reproducible from a cold install.

## Challenges we ran into

- **Making "AI" feel real without depending on a third-party LLM.** We solved it with a weighted, evidence-grade signal engine that surfaces *why* every score exists. The result is more trustworthy than a black-box model.
- **Polish without bloat.** We aggressively cut features that didn't earn their pixel cost. Every view fits one focused workflow.
- **Reddit-native UX, not webapp-on-top-of-Reddit.** The console runs entirely inside Devvit's iframe with native navigation and context (`subredditName`, `username`, `postId`), and the splash post is intentionally lightweight so it loads instantly inline.

## Accomplishments we're proud of

- Every interaction has a justification. There is no "trust me, the model said so."
- The whole console is responsive at 0 ms because reasoning runs locally.
- A reproducible cinematic crisis demo — judges see exactly what we see.
- Lint-clean, type-checked, single-bundle build that's ready to ship.

## What we learned

- Moderators want **transparency**, not magic. Every "AI" decision must show its work.
- **One screen, five answers** is more useful than ten dashboards.
- The single highest-leverage moment is the removal — so we made it one click.

## What's next

- Plug in real LLM scoring behind the same interface (transparent and quotable evidence stays intact).
- ModMail thread integration and cross-subreddit ban propagation.
- Webhook → Discord/Slack escalations during crisis mode.
- Mod team analytics: per-mod time saved, decisions reviewed, fairness drift.

---

## Built with

`Devvit` · `TypeScript` · `React 19` · `Tailwind CSS 4` · `Vite` · `Hono` · `Redis` · `Reddit API`

---

## Project impact

- **Time saved per moderator.** In the seeded scenario, MODOS surfaces 24 pending items and ranks 8 critical, 3 high, 1 medium, 12 low. A single "Approve all low" + "Remove all critical" command cleans 20 items in two clicks. We estimate **5–10 hours per moderator per week** across mid-to-large subreddits.
- **Reduced burnout.** Repetitive writing is gone. The Removal Assistant drafts a thoughtful response that references real evidence; mods edit, click, move on.
- **Faster crisis response.** Brigades that would take 30+ minutes to manually identify show up on Raid Radar within a single 1-minute polling window.
- **Mod team consistency.** Shared rules and shared memory turn every individual judgment into team knowledge.
- **Ecosystem-wide usefulness.** MODOS works on any subreddit with no per-community configuration. Install → demo → moderate.

---

## Why this should win

1. **It's a product, not a prototype.** Polished UI, considered empty states, skeleton loaders, command palette, microinteractions, and a self-contained reasoning engine. Lint-clean, type-checked, single-bundle build.
2. **It tackles all four judging criteria head-on.** Community impact (huge), polish (Linear/OpenAI-grade), reliable UX (one screen, no learning curve), and ecosystem impact (works on every sub from day one).
3. **It feels native to Reddit.** Devvit menu items, inline splash, expanded console, real Reddit context — and an orange accent that nods to Reddit without imitating it.
4. **It's memorable.** The crisis demo lands in 60 seconds with a felt "holy crap, this is the future" moment when Raid Radar lights up and crisis mode auto-engages.
5. **It's publish-ready.** README, Devpost copy, demo script, deterministic seed, architecture diagram, screenshots — every artifact a judge or PM could possibly ask for is already in the repo.

---

## Competitive differentiation

- **AutoMod / Reddit native tools** — powerful but configuration-heavy, opaque, and require regex/YAML. MODOS gives the same expressive power in plain English with a visible match preview.
- **Toolbox (RES-style mod extensions)** — a useful productivity layer, but lives in the browser, not in Devvit, and doesn't unify queue, removal, raids, rules, and memory into one workflow.
- **Other LLM-moderation projects** — typically chat wrappers around GPT. MODOS is a *product* with explicit, auditable scoring, and a UX designed for moderators, not for an "AI demo."

---

## Launch-ready branding copy

**MODOS — the moderation OS Reddit deserves.**

Risk-scored. Evidence-first. Brigade-aware. Shared-memory. One screen.

Ten hours back, every week, to every moderator.
