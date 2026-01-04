# agent-skills

Canonical repository for reusable agent skills, MCP servers, and custom commands.
Configurations are deployed by copying into user-level directories for Codex and Claude Code.

## Quick Start

```bash
# Sync everything
python3 bin/sync-skills.py      # Skills
python3 bin/sync-mcp.py         # MCP servers
python3 bin/sync-commands.py    # Custom commands/prompts
```

## Repository Layout

```
├── skills/           # Reusable agent skills (SKILL.md + references)
├── mcp/              # MCP server configurations
│   └── servers.json  # Canonical MCP definitions
├── commands/         # Custom slash commands/prompts
├── bin/              # Sync and validation scripts
└── templates/        # Scaffolds for new skills
```

## Syncing MCP Servers

MCP servers are defined once in `mcp/servers.json` and synced to both tools.

```bash
python3 bin/sync-mcp.py           # Sync to both tools
python3 bin/sync-mcp.py --dry-run # Preview changes
python3 bin/sync-mcp.py --claude-only
python3 bin/sync-mcp.py --codex-only
```

**Destinations:**
- Claude Code: `~/.claude.json` → `mcpServers`
- Codex: `~/.codex/config.toml` → `[mcp_servers.*]`

**Example `mcp/servers.json`:**

```json
{
  "playwright": {
    "type": "stdio",
    "command": "bunx",
    "args": ["@playwright/mcp@latest"]
  },
  "supabase": {
    "type": "http",
    "url": "https://mcp.supabase.com/mcp?project_ref=..."
  }
}
```

## Syncing Skills

Skills are copied to user-level directories for both tools.

```bash
python3 bin/sync-skills.py              # Sync all skills
python3 bin/sync-skills.py --dry-run    # Preview changes
python3 bin/sync-skills.py --prune      # Remove orphaned skills
python3 bin/sync-skills.py --only myapp # Sync specific skill
```

**Destinations:**
- Claude Code: `~/.claude/skills/`
- Codex: `~/.codex/skills/`

**Override with environment variables:**
- `CODEX_SKILLS_DIR`
- `CLAUDE_SKILLS_DIR`

## Syncing Commands

Custom commands are defined in `commands/` and synced to both tools.

```bash
python3 bin/sync-commands.py              # Sync all commands
python3 bin/sync-commands.py --dry-run    # Preview changes
python3 bin/sync-commands.py --prune      # Remove orphaned commands
```

**Destinations:**
- Claude Code: `~/.claude/commands/` (invoked as `/command-name`)
- Codex: `~/.codex/prompts/` (invoked as `/prompts:command-name`)

**Example `commands/review-pr.md`:**

```markdown
---
description: Review PR changes for issues
---

Review the current PR diff and identify:
1. Potential bugs or issues
2. Missing error handling
3. Security concerns
4. Suggestions for improvement
```

## Secrets Management with dotenvx

Skills can use `${VAR_NAME}` placeholders that get substituted at sync time.
Secrets are stored encrypted in `.env` using [dotenvx](https://dotenvx.com).

### Setup

1. Install dotenvx: `npm install -g @dotenvx/dotenvx`
2. Copy the example: `cp .env.example .env`
3. Add your secrets to `.env`
4. Encrypt: `dotenvx encrypt`
5. Keep `.env.keys` safe (gitignored)

### Getting the Private Key

The `.env.keys` file is stored at `~/work/skills/.env.keys`. Copy it before syncing:

```bash
cp ~/work/skills/.env.keys .env.keys
```

### Files

| File | Committed | Purpose |
|------|-----------|---------|
| `.env` | Yes | Encrypted secrets (safe to commit) |
| `.env.keys` | No | Private decryption key (gitignored) |
| `.env.example` | Yes | Template showing required variables |

### Using Placeholders in Skills

```markdown
## Procedure
1. Call the API with key `${OPENAI_API_KEY}`
```

### Syncing with Secrets

```bash
# Decrypt and inject secrets, then sync
dotenvx run -- python3 bin/sync-skills.py

# In CI, set DOTENV_PRIVATE_KEY instead
DOTENV_PRIVATE_KEY="..." python3 bin/sync-skills.py
```

## Managed Marker

Each deployed skill contains a `.managed-by-agent-skills-repo` file with:
- Repo URL
- Git commit SHA
- Timestamp (UTC)
- Skill name

## Validation

```bash
python3 bin/validate-skills.py
```

CI runs validation on push and pull request.

## Templates

- `templates/skill-skeleton/` - Base skill scaffold
- `templates/project-skills-skeleton/` - Tool-specific project skills
