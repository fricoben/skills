# agent-skills

Canonical repository for reusable agent skills. Skills are deployed by copying into
user-level directories for Codex and Claude Code (no symlinks).

## Repository layout

- `skills/` - canonical skills (empty for now)
- `bin/` - validation, sync, and scaffolding utilities
- `templates/` - skeletons for creating new skills
- `.github/workflows/ci.yml` - CI validation

## Validate skills

```bash
python3 bin/validate-skills.py
```

## Sync skills to user directories

Defaults:
- Codex: `~/.codex/skills/`
- Claude Code: `~/.claude/skills/`

Override defaults:
- `CODEX_SKILLS_DIR`
- `CLAUDE_SKILLS_DIR`

Example:

```bash
python3 bin/sync-skills.py --dry-run
python3 bin/sync-skills.py --prune
python3 bin/sync-skills.py --only myapp-ui
```

## Secrets management with dotenvx

Skills can use `${VAR_NAME}` placeholders that get substituted at sync time. Secrets
are stored encrypted in `.env` using [dotenvx](https://dotenvx.com).

### Setup

1. Install dotenvx: `npm install -g @dotenvx/dotenvx` (or `brew install dotenvx/brew/dotenvx`)
2. Copy the example: `cp .env.example .env`
3. Add your secrets to `.env`
4. Encrypt: `dotenvx encrypt`
5. Keep `.env.keys` safe (gitignored - contains the private key)

### Getting the private key

The `.env.keys` file is stored at `~/work/skills/.env.keys`. Copy it to this repo before syncing:

```bash
cp ~/work/skills/.env.keys .env.keys
```

### Files

| File | Committed | Purpose |
|------|-----------|---------|
| `.env` | Yes | Encrypted secrets (safe to commit) |
| `.env.keys` | No | Private decryption key (gitignored) |
| `.env.example` | Yes | Template showing required variables |

### Using placeholders in skills

In your skill markdown files, use `${VAR_NAME}` syntax:

```markdown
## Procedure
1. Call the API with key `${OPENAI_API_KEY}`
```

### Syncing with secrets

```bash
# Decrypt and inject secrets, then sync
dotenvx run -- python3 bin/sync-skills.py

# In production/CI, set DOTENV_PRIVATE_KEY env var instead of using .env.keys
DOTENV_PRIVATE_KEY="..." python3 bin/sync-skills.py
```

Unresolved placeholders will trigger a warning but won't fail the sync.

## Managed marker

Each deployed skill contains a `.managed-by-agent-skills-repo` file with the repo
URL (if available), git commit SHA, timestamp (UTC), and skill name.

## Templates

- `templates/skill-skeleton/` - base skill scaffold
- `templates/project-skills-skeleton/` - example for tool-specific project skills

## CI

CI runs `bin/validate-skills.py` on push and pull request.
