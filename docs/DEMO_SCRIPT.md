# MODOS — cinematic 60-second demo script

This script is timed for a single take. Every beat is hard-coded by the
deterministic seed in `src/shared/seed.ts`, so the same numbers, names, and
chart shapes appear every run.

## Setup

- Install MODOS on a test subreddit.
- The `onAppInstall` trigger seeds Redis and creates a console post automatically.
- Alternatively, run `MODOS_WEB=1 npx vite` for a pure-browser preview.

---

## 00:00 — Title

Open with the **MODOS splash inline post** in the Reddit feed. Pause one beat
on:

> *MODOS — the AI-native operating system for Reddit moderation.*

## 00:04 — Open console

Click **Open the MODOS console**. The expanded view fades in to **Mission
Control**.

Voice-over:

> "Mod teams burn out from queues, raids, and repetition. MODOS turns that
> work into a single calm screen."

Show:

- the **CRISIS · BRIGADE DETECTED** chip in the topbar (already red, pulsing),
- the four metric cards (Pending 24 · Resolved 312 today · Time saved 3h 4m · Reasoning engine 0.1),
- the weekly volume chart and risk distribution.

## 00:14 — Triage queue

Click **AI Queue** in the sidebar.

Voice-over:

> "Every item is scored with evidence — not a black box."

Click on the top critical item: *"Update on the new flair system — feedback please"*.

Show the **MODOS Reasoning** panel: self-harm directive (+0.95), personal
insult (+0.35), 1 user report (+0.08). Highlight that the score adds up
visually with the right-side bars.

## 00:24 — Removal assistant

Click **Generate a polished removal response in one click**.

The draft animates in. Switch between **firm / neutral / friendly** tabs to
show tone control. Click **Remove**.

Voice-over:

> "One click drafts a thoughtful, evidence-grounded reply. One more click
> resolves it."

## 00:32 — Raid radar

Click **Raid Radar** in the sidebar.

The page opens on an active **incident timeline**. Pan over:

- the live signal chart with reports, posts, comments, and toxicity,
- the MODOS auto-response checklist (5 measures, all green),
- the timeline events (toxicity index 0.71 sustained, +480% comment volume,
  7 reports from <2d-old accounts targeting one user).

Voice-over:

> "Coordinated brigades used to take hours to identify. MODOS catches them
> in 90 seconds and auto-engages a defensible posture."

## 00:42 — Natural-language rules

Click **NL Rules**. Click one of the sample prompts:

> *"Flag posts from accounts under 7 days old with toxic language or
> coordinated reports."*

Click **Compile rule**. The rule appears in the list with a live "matched
items" count and a preview of the matches.

Voice-over:

> "No regex. No YAML. You describe the rule. MODOS finds it."

## 00:50 — Mod memory

Click **Mod Memory**, then click **u/rage_qu1t**.

Show the profile: 124d account, 318 karma, 4 warnings, 2 prior bans, 42%
removal rate, toxicity trend sparkline, and a pinned mod note about prior
brigading.

Voice-over:

> "Every decision your team makes becomes shared memory — so consistency
> compounds."

## 00:57 — Command palette

Press **⌘K**. Show the Linear-style command palette with grouped commands.

Voice-over:

> "MODOS — your moderation OS, on Devvit."

End on the **MODOS** wordmark in the sidebar.

---

## Closing slide

> Built for the Reddit Mod Tools and Migrated Apps Hackathon.
> Source: github.com/InterstellarMC/modos
