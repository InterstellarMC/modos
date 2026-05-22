---
name: devvit-publish
description: How to authenticate the Devvit CLI, register an app slug, and publish MODOS (or any Devvit web app) to the Reddit App Directory from this remote sandbox. Use when the user asks to upload, publish, deploy, ship, or list the app on Reddit.
---

# Devvit Publishing (MODOS)

## Why this skill exists

The Devvit CLI (`@devvit/cli@0.12.x`) is designed for a local dev environment: it opens a browser to `reddit.com/api/v1/authorize` for login, and opens `developers.reddit.com/new` with a `redirect_url=http://localhost:<port>/...` for app registration. Both of those localhost endpoints are unreachable from the user's browser when you're running on a remote sandbox, so doing this naively will hang forever.

This skill captures the workarounds that actually worked end-to-end (`modos-live` v0.1.0 was published live to the App Directory using exactly this flow).

## Step 1 — Authenticate (`devvit login --copy-paste`)

Run:

```bash
npx devvit login --copy-paste
```

The CLI prints an authorize URL like `https://www.reddit.com/api/v1/authorize?client_id=…&redirect_uri=https%3A%2F%2Fdevelopers.reddit.com%2Fcli-login&…`.

- Send that URL to the user via `message_user` with `block_on_user=true`.
- They open it signed in as the Reddit account they want to publish under, approve the OAuth grant, and Reddit redirects them to `developers.reddit.com/cli-login` which displays a short code.
- They paste that code back to you.
- Use `write_to_process` (not `exec`) to send the code + `<CR>` to the running CLI shell.

On success the CLI writes `/home/ubuntu/.devvit/token` and prints `Logged in as <reddit_username>`.

Verify with `npx devvit whoami`.

## Step 2 — Register the app slug (manual, on Reddit)

If the app slug in `devvit.json` is not already registered, `devvit upload` will try to open `developers.reddit.com/new?...&redirect_url=http://localhost:<port>/...` and wait for a callback to its local server. **The user's browser cannot reach your localhost**, so this hangs.

Don't try to tunnel or modify the redirect URL — it's fiddlier than just doing it manually:

1. Kill the `devvit upload` process.
2. Ask the user to open https://developers.reddit.com/apps in their browser (signed in as the same Reddit account they authorized with) and create the app via **Create an app** with the desired slug.
3. If the desired slug is taken globally, fall back to a variant (we ended up with `modos-live`). The user picks; you confirm and update `devvit.json`.
4. Update the local `devvit.json` `name` field to **exactly** match the registered slug. The CLI looks up the app by this slug.

## Step 3 — `devvit upload`

```bash
npx devvit upload
```

This builds (`vite build`) and uploads the bundle to the Devvit registry. With the slug already registered, this skips the new-app dialog and just pushes the build.

Expected warnings that are safe to ignore:

- `We couldn't install your app to the new playtest subreddit … There's already an installation of this app in that location` — fine, the slug already had a playtest install from when the user manually created the app.

On success: `✨ Visit https://developers.reddit.com/apps/<slug> to view your app!`

Uploaded apps are visible only to the owner and installable only to small (<200 subscriber) test subreddits until they're published.

## Step 4 — `devvit publish`

```bash
npx devvit publish --public   # full App Directory listing (slower review)
npx devvit publish            # unlisted (faster review, installable by link)
```

The CLI bumps the version (minor by default), uploads source for the Devvit review team, files a publish request, then **prompts interactively**:

```
? What would you like to do?
  ❯ Stop for now - I want to clean up my project first!
    Continue with the source code upload, and ask me every time.
    Continue with the source code upload, and don't ask me again for this app.
```

Send `<DOWN><CR>` via `write_to_process` to pick the middle option ("ask every time"). Don't pick option 3 unilaterally — that disables future confirmations.

Apps with custom posts (MODOS qualifies) are routed through a human review queue. The CLI ends with:

```
Submitting version "<X.Y.Z>" for review... done
…You'll receive an email when your app has been approved.
```

The user receives the approval email at the address tied to their Reddit account.

## Step 5 — Commit the slug change

If you had to change `devvit.json`'s `name`, commit that on a fresh branch off `main` (not the merged feature branch) and open a focused PR. Title pattern: `chore(devvit): publish as <slug> to Reddit App Directory`.

## Useful commands

```bash
npx devvit whoami           # confirm auth
npx devvit list apps        # apps owned by current user
npx devvit publish --withdraw  # cancel a pending publish request
npx devvit logout           # if switching accounts
```

## Auth + scope notes

- The Devvit token lives in `/home/ubuntu/.devvit/token`. Don't print or commit it.
- The publishing Reddit account does NOT have to match the GitHub account that owns the repo (in our case GitHub is `InterstellarMC`, Reddit is `u/UpbeatSound9649`).
- Always confirm with the user which Reddit account they want the app published under before kicking off login.
