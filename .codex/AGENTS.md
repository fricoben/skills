# Agent Skills Repository

This is the canonical repository for reusable agent skills.

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

- `.env` - Encrypted secrets (committed)
- `.env.keys` - Private decryption key (copy from `~/work/skills/.env.keys`, gitignored)
- `bin/sync-skills.py` - Deploys skills to `~/.claude/skills/` and `~/.codex/skills/`

## Placeholder Substitution

Skills can use `${VAR_NAME}` placeholders in markdown files. These are replaced with actual values from environment variables during sync.

Available secrets:
- `${OPENAI_API_KEY}` - OpenAI API key
- `${GOOGLE_GENAI_API_KEY}` - Google Gemini API key
- `${DASHSCOPE_API_KEY}` - Alibaba DashScope API key
