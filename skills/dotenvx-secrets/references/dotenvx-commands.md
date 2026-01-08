# dotenvx Commands Reference

## Core Commands

### encrypt
Encrypt a `.env` file in place.

```bash
# Encrypt default .env
dotenvx encrypt

# Encrypt specific file
dotenvx encrypt -f .env.production

# Encrypt multiple files
dotenvx encrypt -f .env.development -f .env.production
```

### decrypt
Decrypt an encrypted `.env` file (requires keys).

```bash
# Decrypt to stdout
dotenvx decrypt -f .env.vibetracking

# Decrypt to file
dotenvx decrypt -f .env.vibetracking > .env.vibetracking.decrypted
```

### run
Run a command with decrypted environment variables.

```bash
# Basic usage
dotenvx run -- npm start

# With specific env file
dotenvx run -f .env.production -- node server.js

# Multiple env files (later files override earlier)
dotenvx run -f .env -f .env.local -- npm run dev

# Override specific variable
dotenvx run -f .env -- env VAR=override npm start
```

### vault
Manage the dotenvx vault.

```bash
# Initialize vault
dotenvx vault init

# Status
dotenvx vault status
```

### set
Set a single environment variable (encrypts automatically).

```bash
dotenvx set KEY value -f .env.production
```

### get
Get a decrypted value.

```bash
dotenvx get KEY -f .env.production
```

## Flags Reference

| Flag | Description |
|------|-------------|
| `-f, --env-file` | Specify env file(s) to use |
| `--overload` | Override existing env vars |
| `-q, --quiet` | Suppress output |
| `--debug` | Enable debug logging |

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DOTENV_PRIVATE_KEY` | Default private key for decryption |
| `DOTENV_PRIVATE_KEY_<ENV>` | Per-environment private key (e.g., `DOTENV_PRIVATE_KEY_PRODUCTION`) |

## Common Patterns

### Development workflow
```bash
# Encrypt after editing
dotenvx encrypt -f .env.development

# Run dev server
dotenvx run -f .env.development -- npm run dev
```

### CI/CD
```bash
# Set DOTENV_PRIVATE_KEY_PRODUCTION as CI secret, then:
dotenvx run -f .env.production -- npm run build
```

### Adding new secret
```bash
# 1. Decrypt existing file
dotenvx decrypt -f .env.production > .env.production.tmp

# 2. Add new secret to .env.production.tmp

# 3. Replace and re-encrypt
mv .env.production.tmp .env.production
dotenvx encrypt -f .env.production
```
