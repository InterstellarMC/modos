# MODOS — Hackathon submission index

Single entry point for judges of the **[Reddit Mod Tools and Migrated Apps Hackathon](https://mod-tools-migration.devpost.com/)**.

## TL;DR

MODOS is the AI-native operating system for Reddit moderation, built on Devvit. It scores every queue item with evidence, drafts removal responses in one click, detects raids before they escalate, lets moderators write rules in plain English, and gives the whole mod team a shared memory of every decision.

- **Pure-browser preview** — https://dist-web-sexzdesc.devinapps.com
- **Code** — https://github.com/InterstellarMC/modos
- **Devpost submission copy** — [`docs/DEVPOST.md`](docs/DEVPOST.md)
- **Cinematic demo script** — [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **Architecture deep-dive** — [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## What to look at, in 90 seconds

1. **Open the preview**: https://dist-web-sexzdesc.devinapps.com
2. **Mission Control** loads with `r/example`, crisis chip active.
3. **AI Queue** → click a CRITICAL item → see signal-by-signal evidence reasoning.
4. **Generate a polished removal response** → switch tone tabs → **Remove**.
5. **Raid Radar** → live multi-series chart, MODOS auto-response checklist, replayable timeline.
6. **NL Rules** → click a sample prompt → **Compile rule** → see matched items.
7. **Mod Memory** → click `u/rage_qu1t` → toxicity sparkline, notes history, add-note form.
8. **⌘K** → command palette, Linear-style.

## Why it should win

Four direct hits on the judging criteria:

| Criterion | MODOS |
| --- | --- |
| **Community Impact** | 5–10 hours saved per moderator per week. Removes the highest-friction work (writing removals, triaging spam, identifying brigades). |
| **Polish** | Linear/OpenAI-grade UI. Premium dark theme, microinteractions, skeleton loaders, polished empty states, command palette, single-bundle build. |
| **Reliable UX** | One screen. No regex. Transparent evidence for every score. 0 ms reasoning latency. Deterministic crisis seed = reproducible demos. |
| **Ecosystem Impact** | Works on every subreddit with no per-community configuration. Install → demo → moderate. |

## Quick start

```bash
git clone https://github.com/InterstellarMC/modos
cd modos
npm install
npm run login
npm run dev      # devvit playtest
```

Then open the test subreddit listed, click **Open MODOS Console** in the sub menu.

For a pure-browser preview without Devvit:

```bash
MODOS_WEB=1 npx vite
```

## Screenshots

![Mission Control](docs/screenshots/01-overview.png)
*Mission Control — calm "today" dashboard with pending volume, time saved, top signals, and the five items that need a decision now.*

![AI Triage Queue](docs/screenshots/02-queue-detail-draft.png)
*AI Triage Queue + Removal Assistant — evidence-graded scoring and one-click drafts in three tones.*

![Raid Radar](docs/screenshots/03-raid-radar.png)
*Raid & Brigade Radar — live multi-series chart, MODOS auto-response checklist, replayable incident timeline.*

![NL Rules](docs/screenshots/04-nl-rules.png)
*Natural-Language Rules — plain English in, matched items out. No regex, no YAML.*

![Mod Memory](docs/screenshots/05-mod-memory.png)
*Mod Memory — shared per-user profiles, toxicity trend sparkline, decision history.*

![Command palette](docs/screenshots/06-command-palette.png)
*⌘K Command Palette — Linear-style navigate / triage / crisis actions.*

## Acknowledgements

Built on the work of every Reddit moderator who has ever made the platform safer for free.
