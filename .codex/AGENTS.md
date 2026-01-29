# Agent Skills Repository

Canonical repository for reusable agent skills.

## Skills (managed by Vercel `skills` CLI)

Sync all skills to installed agents:

```bash
npx skills add ./skills -g --all -y
```

Add a skill from the ecosystem (installs + saves to repo):

```bash
bin/add-skill.sh vercel-labs/agent-skills
```

## Commands

```bash
python3 bin/sync-commands.py
```

## Key Files

- `skills/*/SKILL.md` - Skill definitions
- `commands/*.md` - Slash commands
- `mcp/servers.json` - MCP server definitions
- `bin/add-skill.sh` - Add a skill from the ecosystem and save to repo
- `bin/validate-skills.py` - Validate skill frontmatter, size, and security
