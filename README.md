# agent-skills

A curated pack of 22 agent skills for Claude Code, Codex, Cursor, and 30+ other AI agents. Distributed via the [Vercel `skills` CLI](https://github.com/vercel-labs/skills).

## Install all skills

```bash
npx skills add fricoben/skills --all -g -y
```

Install a single skill:

```bash
npx skills add fricoben/skills --skill pdf -g -y
```

Preview available skills before installing:

```bash
npx skills add fricoben/skills --list
```

## Available Skills

| Skill | Description |
|-------|-------------|
| agent-browser | Headless browser automation with Playwright for web scraping, form filling, and testing |
| atomic-design | Front-end component architecture separating pure UI from data-connected components |
| bitwarden-secrets | Manage and retrieve secrets from Bitwarden Secrets Manager via bws CLI |
| code-review-excellence | Code review practices for constructive feedback, catching bugs, and knowledge sharing |
| copywriting | Write and improve marketing copy for landing pages, pricing pages, and CTAs |
| docx | Create, edit, and analyze Word documents with tracked changes and formatting |
| dotenvx-secrets | Manage encrypted environment variables using dotenvx vault |
| e2e-testing | End-to-end testing for web applications using agent-browser CLI |
| find-skills | Discover and install agent skills from the open ecosystem |
| media-compression | Compress images and videos using FFmpeg |
| mermaid-diagrams | Create software diagrams (class, sequence, flowchart, ERD, C4, state) using Mermaid |
| pdf | Extract text, create, merge, split, and fill forms in PDF documents |
| pptx | Create, edit, and analyze PowerPoint presentations with layouts and speaker notes |
| proton-bridge | Read, organize, and send Proton Mail via local IMAP/SMTP bridge |
| remotion-best-practices | Best practices for Remotion video creation in React |
| review-commit-push | Agentic loop: commit, push, create PR, review, fix bugs, wait for CI, and merge |
| seo-audit | Audit and diagnose technical SEO issues with actionable recommendations |
| sync-config | Sync all skills and MCP servers to all installed agents |
| skill-creator | Guide for creating and updating agent skills |
| vercel-react-best-practices | React and Next.js performance optimization from Vercel Engineering |
| web-design-guidelines | Review UI code for Web Interface Guidelines and accessibility compliance |
| xlsx | Create, edit, and analyze spreadsheets with formulas, formatting, and visualization |

## Requirements

- Node.js (for `npx`)
- A compatible AI agent (Claude Code, Codex, Cursor, and [30+ others](https://github.com/vercel-labs/skills))

---

## Contributing

### Repository Layout

```
├── skills/           # Reusable agent skills (SKILL.md + references)
├── mcp/              # MCP server configurations
│   └── servers.json  # Canonical MCP definitions
└── bin/              # Utility scripts
```

### Syncing Skills Locally

```bash
npx skills add ./skills -g --all -y
```

### Adding a Skill from the Ecosystem

```bash
bin/add-skill.sh vercel-labs/agent-skills
```

This installs the skill to all detected agents AND saves it into this repo's `skills/` directory.

### Creating a New Skill

Use the `skill-creator` skill: ask your agent to create a new skill in `skills/<name>/SKILL.md`.
Or use `npx skills init <name>` for a minimal scaffold.

### Syncing MCP Servers

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

### Placeholder Substitution

Skills can use `${VAR_NAME}` placeholders for secrets. The Vercel CLI copies files verbatim without substitution, so set environment variables directly for agents to read at runtime, or use dotenvx to inject them before syncing.

### Validation

```bash
python3 bin/validate-skills.py
```

CI runs validation on push and pull request.
