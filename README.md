# agent-skills

Canonical repository for reusable agent skills, MCP servers, and custom commands.
Skills are distributed using the [Vercel `skills` CLI](https://github.com/vercel-labs/skills) to all installed agents (Claude Code, Codex, Cursor, and 30+ others).

## Quick Start

```bash
# Sync skills to all installed agents
npx skills add ./skills -g --all -y

# Sync commands and MCP servers
python3 bin/sync-commands.py
python3 bin/sync-mcp.py
```

## Adding a Skill from the Ecosystem

```bash
bin/add-skill.sh vercel-labs/agent-skills
```

This installs the skill to all detected agents AND saves it into this repo's `skills/` directory.

## Creating a New Skill

Use the `skill-creator` skill: ask your agent to create a new skill in `skills/<name>/SKILL.md`.
Or use `npx skills init <name>` for a minimal scaffold.

## Repository Layout

```
├── skills/           # Reusable agent skills (SKILL.md + references)
├── mcp/              # MCP server configurations
│   └── servers.json  # Canonical MCP definitions
├── commands/         # Custom slash commands/prompts
└── bin/              # Utility scripts
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

## Validation

```bash
python3 bin/validate-skills.py
```

CI runs validation on push and pull request.
