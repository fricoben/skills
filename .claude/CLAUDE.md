# Agent Skills Repository

Canonical repository for reusable agent skills, commands, and MCP server configurations.

## Skills (managed by Vercel `skills` CLI)

### Install all skills (for consumers)

```bash
npx skills add fricoben/skills --all -g -y
```

### Sync all skills locally (for maintainers)

```bash
npx skills add ./skills -g --all -y
```

### Add a skill from the ecosystem

```bash
bin/add-skill.sh vercel-labs/agent-skills
```

This installs the skill to all detected agents AND saves it into this repo's `skills/` directory.

### Create a new skill

Use the `skill-creator` skill: ask your agent to create a new skill in `skills/<name>/SKILL.md`.

## Commands

Sync commands to Claude Code and Codex:

```bash
python3 bin/sync-commands.py
```

## MCP Servers

MCP servers are defined in `mcp/servers.json`. Sync them:

```bash
python3 bin/sync-mcp.py
```

Options:
- `--dry-run` - Preview changes without modifying files
- `--claude-only` - Only sync to Claude Code (~/.claude.json)
- `--codex-only` - Only sync to Codex (~/.codex/config.toml)

## Directory Structure

```
skills/           # Skill definitions (SKILL.md + references)
commands/         # Slash commands (synced to ~/.claude/commands/ and ~/.codex/prompts/)
mcp/              # MCP server configurations
bin/              # Sync, validation, and utility scripts
```

## Validation

```bash
python3 bin/validate-skills.py
```

CI runs validation on push and pull request.
