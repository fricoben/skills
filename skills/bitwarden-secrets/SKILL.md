---
name: bitwarden-secrets
description: >
  Single source of truth for non-Vercel secrets (API keys, account credentials,
  service tokens) on Ben's Mac and on Cloud: Bitwarden Secrets Manager via bws,
  bwsrun, bwsset and bwsadmin. Replaces dotenvx (retired 6 Nov 2026). App runtime
  variables live in Vercel instead (see vercel-cli). Trigger terms: bitwarden, bws,
  bwsrun, bwsset, bwsadmin, secrets, secret, api key, credentials, password, token,
  env vars, dotenvx, .env.socials, .env.lfg_admin, rotate a key, add a secret.
---

# Bitwarden Secrets Manager (bws, bwsrun, bwsset, bwsadmin)

## Where secrets live

| Kind | Source of truth | How to use it |
|---|---|---|
| Variables of an app deployed on Vercel | **Vercel** | `vercel env run -- <cmd>` (default, no file on disk; see `vercel-cli`). `vercel env pull .env.local` only if a tool needs a file |
| Everything else: script/API keys, account credentials, service tokens, non-Vercel parts of apps | **Bitwarden Secrets Manager** | `bwsrun <repo> -- <cmd>` |

dotenvx is retired. Do not create `.env.<name>` encrypted files, do not use
`dotenvx`, `dx` or `~/.dotenvx/keys`, and do not suggest them.

## Layout (Free plan: max 3 projects, 2 machine accounts; 2 projects used)

Secret names are `<repo>__<NAME>`, for example `socials__TYPEFULLY_KEY`. A secret without
that prefix is invisible to `bwsrun`/`bwsset`. They find secrets by prefix, not by
project, so the project only matters when a new prefix is created.

| Project | Prefixes | Readable by |
|---|---|---|
| `ops` | `socials__`, `lfg_admin__`, `backup__`, `hermes__`, `fricorepo__`, `lfg_compliance__`, `infra__` (infrastructure tokens: `VERCEL_TOKEN`, `BOAT_API_KEY`; `bwsrun infra -- <cmd>`), `archive__` (retired dotenvx keys, 6 Nov 2026) | `mac-ben` (read/write), `cloud` (read) |
| `apps` | `boost__`, `relens__`, `trustless__` (only values that are not in Vercel) | `mac-ben` (read/write), `cloud` (read) |

Rule for a new prefix: a deployed app's non-Vercel value goes in `apps`;
everything else (scripts, account credentials, Hermes, backups, any repo) goes in `ops`.
(`ops` was `shared` until 12 Nov 2026; the former `mac` project was merged into it.
There is no `persona__` prefix any more.)

Machine-account tokens (never print, never put in env files or chat):
- Mac (`mac-ben`): separate keychain `~/Library/Keychains/bws.keychain-db`, service `bws-mac`;
  locks after 8 h and on sleep.
- Cloud (`cloud`): `/home/claudine/.config/bws/token` (mode 600, user `claudine`).

## Run a command with a repo's secrets

```bash
bwsrun socials -- bun run verity-sales/crm/scripts/x-me.ts
bwsrun lfg_admin -- bun run legal/scripts/documenso/documenso.ts list
```

- `~/.local/bin/bwsrun` on both the Mac and Cloud (same script).
- Loads only `<repo>__*` secrets and exports them without the prefix (`TYPEFULLY_KEY`),
  plus `BWSRUN_REPO=<repo>`.
- The bws token is never exported to the command; `DOTENV_PRIVATE_KEY*` vars are stripped.
- On the Mac, a locked keychain prompts once (`security unlock-keychain`); in a non-interactive
  shell it fails with that instruction instead.
- Fails if no `<repo>__*` secret is visible, so a script never runs silently without secrets.
- In `package.json`: `"x:me": "bwsrun socials -- bun run …"`.
- Read one value into a variable without printing it:
  `v=$(bwsrun socials -- printenv TELEGRAM_BOT_TOKEN)` (use it, then `unset v`).

## Add, change or rotate a secret

Preferred: the Bitwarden web app (Secrets Manager, project above, name `<repo>__<NAME>`).

From a terminal, value on stdin (never as an argument you type, never in chat):

```bash
pbpaste | bwsset socials TYPEFULLY_KEY && pbcopy < /dev/null   # update or create
```

- `bwsset` updates an existing secret, or creates a new key under a prefix that already
  exists (it picks that prefix's project). It cannot create the first secret of a new
  prefix: create that one in the web app, in the project given by the rule above.
- A single trailing newline on stdin is dropped.
- Only `mac-ben` can write; on Cloud `bwsset` fails (read-only token).

Code that rotates a token (for example the X OAuth refresh token in
`lfg_marketing/verity-sales/crm/src/x-api.ts`) saves it with
`bwsset "$BWSRUN_REPO" <KEY>` with the value on stdin.

## Cloud specifics

- `bwsrun backup` is used by the Hermes `backup-daily` job (`~/.hermes/scripts/backup-lib.sh`).
- Hermes's own credentials (Telegram bot and API, OpenRouter, OpenAI, sandbox proxy, API server,
  Notion MCP token) are `hermes__*` secrets. Hermes loads them at startup through its
  `secrets.command` source `/usr/local/libexec/claudine-secret-source` (one `bws secret list`,
  Hermes timeout 10 s), which also supplies `TWITTERAPI_IO_KEY` (from `socials__`) for
  morning-x. Hermes's built-in `secrets.bitwarden` integration stays disabled.
  `~/.hermes/.env` keeps only non-secret settings; `config.yaml` references `${NOTION_TOKEN}`.
- To add a Hermes secret: create `hermes__<NAME>` from the Mac, add `<NAME>` to the `WANTED`
  list in the helper (owned by root: `sudo`), then
  `sudo systemctl restart claudine-telegram.service` (a system unit, not a user unit).
  The helper exits with an error if any listed secret is missing.
- `~/.hermes/auth.json` (provider logins) is managed by Hermes.
- Cloud's token is read-only on both projects (Ben's decision, 6 Nov 2026); only the Mac can write.
  `bwsadmin` exists only on the Mac.

## Admin tasks: `bwsadmin` (Mac)

`~/.local/bin/bwsadmin <bws args>` runs `bws` with the Mac token from the keychain, forces
JSON output and replaces every `value` with `<redacted>`. It refuses `secret create` and
`--value` (use `bwsset`). Pre-approved for Claude in `~/.claude/settings.json`:
`project list|edit`, `secret list|get|edit`. Anything else (for example `secret delete`,
`project delete`) is not pre-approved and needs Ben.

```bash
bwsadmin project list
bwsadmin secret list | python3 -c 'import json,sys;[print(s["id"],s["key"]) for s in json.load(sys.stdin)]'
bwsadmin secret edit <SECRET_ID> --project-id <PROJECT_ID> --output none   # move a secret
bwsadmin secret edit <SECRET_ID> --key <repo>__<NAME> --output none        # rename a secret
```

Bitwarden returns 404 when listing secrets of an empty project; list all secrets and filter by
`projectId` instead.

## Raw bws CLI (only if bwsadmin cannot do it; Ben runs it)

```bash
export BWS_ACCESS_TOKEN="$(security find-generic-password -s bws-mac -w ~/Library/Keychains/bws.keychain-db)"
bws project list --output table          # names and ids only
bws secret list <PROJECT_ID> --output json | python3 -c 'import json,sys;[print(s["key"]) for s in json.load(sys.stdin)]'
unset BWS_ACCESS_TOKEN
```

`bws secret list/get` output contains values: always filter to keys/ids, never print it
raw. A value starting with `-` needs `--` before the positional arguments
(`bws secret create -- KEY VALUE PROJECT_ID`).

## Never

- Print, echo, log or paste secret values or the bws token; never run `env`/`printenv`
  without a variable name in a shell that has secrets.
- `source` a secrets file into a login shell (that is how the 6 Nov 2026 key exposure happened).
- Commit `.env`, `.env.local` or any file holding values.
- Create a Bitwarden project or machine account without asking (Free plan limits).

## Where this skill lives

One real copy: `~/.agents/skills/bitwarden-secrets`. `~/.claude/skills`, `~/.codex/skills` and
`~/.config/opencode/skills` symlink to it; `cloud-skills-sync` pushes it to Orb and Hermes.
Edit only that copy. Do not add `shared-`/`local-claude-` copies (they are sync artefacts).
