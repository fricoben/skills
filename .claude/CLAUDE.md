# Agent Skills Repository

This is the canonical repository for reusable agent skills and MCP server configurations.

## Syncing MCP Servers

MCP servers are defined in `mcp/servers.json`. Sync them to both Claude Code and Codex:

```bash
python3 bin/sync-mcp.py
```

Options:
- `--dry-run` - Preview changes without modifying files
- `--claude-only` - Only sync to Claude Code (~/.claude.json)
- `--codex-only` - Only sync to Codex (~/.codex/config.toml)

## Syncing Skills

Sync skills to Claude Code and Codex:

```bash
python3 bin/sync-skills.py
```

Or sync a specific skill:

```bash
python3 bin/sync-skills.py --only media-compression
```

## Syncing Commands

Sync commands to Claude Code and Codex:

```bash
python3 bin/sync-commands.py
```

## Directory Structure

```
skills/           # Skill definitions (synced to ~/.claude/skills/ and ~/.codex/skills/)
commands/         # Claude Code commands (synced to ~/.claude/commands/)
workflows/        # Workflow scripts invoked by commands
mcp/              # MCP server configurations
bin/              # Sync and validation utilities
```

## Key Files

- `skills/*/SKILL.md` - Individual skill definitions
- `commands/*.md` - Claude Code commands (invoked as /command-name)
- `workflows/*.py` - Workflow scripts for complex multi-step tasks
- `mcp/servers.json` - MCP server definitions
- `bin/sync-skills.py` - Deploys skills to `~/.claude/skills/` and `~/.codex/skills/`
- `bin/sync-commands.py` - Deploys commands to `~/.claude/commands/` and `~/.codex/prompts/`
- `bin/sync-mcp.py` - Deploys MCP configs to `~/.claude.json` and `~/.codex/config.toml`
- `bin/validate-skills.py` - Validates skill frontmatter, size, and security
- `bin/new-skill.py` - Creates a new skill from template

## Managing Secrets with dotenvx

This repo includes a `dotenvx-secrets` skill for managing encrypted environment variables.

For projects that need secrets (like API keys), use dotenvx vault:

1. Create project-specific env files (e.g., `.env.vibetracking`)
2. Encrypt with `dotenvx encrypt -f .env.projectname`
3. Store `.env.keys` securely (never commit)
4. Run with `dotenvx run -f .env.projectname -- <command>`

See `skills/dotenvx-secrets/SKILL.md` for full documentation.
