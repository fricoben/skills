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

Before syncing skills with secrets, copy the private key:

```bash
cp ~/work/skills/.env.keys .env.keys
```

Then sync with dotenvx:

```bash
dotenvx run -- python3 bin/sync-skills.py
```

Or sync a specific skill:

```bash
dotenvx run -- python3 bin/sync-skills.py --only media-creation
```

## Key Files

- `mcp/servers.json` - Canonical MCP server definitions (syncs to Claude Code and Codex)
- `.env` - Encrypted secrets (committed)
- `.env.keys` - Private decryption key (copy from `~/work/skills/.env.keys`, gitignored)
- `bin/sync-mcp.py` - Deploys MCP configs to `~/.claude.json` and `~/.codex/config.toml`
- `bin/sync-skills.py` - Deploys skills to `~/.claude/skills/` and `~/.codex/skills/`

## Placeholder Substitution

Skills can use `${VAR_NAME}` placeholders in markdown files. These are replaced with actual values from environment variables during sync.

Available secrets:
- `${OPENAI_API_KEY}` - OpenAI API key
- `${GOOGLE_GENAI_API_KEY}` - Google Gemini API key
- `${DASHSCOPE_API_KEY}` - Alibaba DashScope API key
