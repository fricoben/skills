---
name: dotenvx-secrets
description: >
  Manage encrypted environment variables using dotenvx vault for secure secret management.
  Trigger terms: dotenvx, secrets, env, encrypted, vault, environment variables,
  .env, credentials, api keys, secure config, decrypt, encrypt secrets.
---

## When to Use
- Adding new encrypted environment variables to a project
- Setting up dotenvx vault for a new project
- Creating project-specific .env files (e.g., `.env.vibetracking`)
- Migrating plaintext .env files to encrypted format
- Sharing secrets securely across machines using vault

## When NOT to Use
- The user wants you (the agent) to handle actual secret values directly
- Secrets that should be managed by cloud provider secret managers (AWS Secrets Manager, etc.)
- CI/CD secrets (use GitHub Actions secrets, etc.)

## CRITICAL: Agent Limitations

**NEVER ask the user for actual secret values.** Instead:
1. Guide them through commands they run themselves
2. Provide the exact command syntax with placeholders
3. Explain what each step does

The agent must NOT:
- Ask "what is your API key?"
- Request users paste secrets into the chat
- Store or process actual secret values

## Inputs the Agent Should Ask For (only if missing)
- **Project name**: What project is this for? (e.g., "vibetracking", "myapp")
- **Secret names**: What environment variables need to be added? (e.g., `SUPABASE_URL`, `API_KEY`)
- **Environment**: Is this for dev, staging, or production?

## Outputs / Definition of Done
- User has exact commands to run for adding their secrets
- Clear explanation of the vault/encryption flow
- Verification steps to confirm setup worked

## Procedure

### 1. Check dotenvx Installation
```bash
dotenvx --version
```
If not installed:
```bash
brew install dotenvx/brew/dotenvx
```

### 2. Initialize Vault (First Time Only)

For a new project, initialize dotenvx:
```bash
dotenvx vault init
```

This creates:
- `.env.vault` - Encrypted vault file (commit this)
- `.env.keys` - Private decryption keys (NEVER commit, add to .gitignore)

### 3. Add Secrets to Project-Specific .env File

**Tell the user to run these commands themselves:**

For a project like "vibetracking", create `.env.vibetracking`:

```bash
# Create the env file with your secrets (run this yourself, replacing with real values)
cat > .env.vibetracking << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
EOF
```

### 4. Encrypt the Secrets

```bash
dotenvx encrypt -f .env.vibetracking
```

This transforms plaintext values into encrypted format:
```
NEXT_PUBLIC_SUPABASE_URL="encrypted:BO3QmRRr3ZzK1tXBU8ILXI..."
```

### 5. Store Keys Globally (Recommended)

The encryption creates/updates `.env.keys` with a private key like:
```
DOTENV_PRIVATE_KEY_VIBETRACKING="abc123..."
```

**NEVER commit `.env.keys` to any repository.** Instead, store keys in `~/.dotenvx/keys` so they persist across all terminals and workspaces.

#### One-Time Setup

1. Create the global keys file:
   ```bash
   mkdir -p ~/.dotenvx
   touch ~/.dotenvx/keys
   chmod 600 ~/.dotenvx/keys  # Only you can read it
   ```

2. Add to your shell profile (`~/.zshrc` or `~/.bashrc`):
   ```bash
   echo '[ -f ~/.dotenvx/keys ] && source ~/.dotenvx/keys' >> ~/.zshrc
   source ~/.zshrc
   ```

#### Adding Keys to Global Storage

After encrypting, copy the key from `.env.keys` to your global file:

```bash
# View the generated key
cat .env.keys

# Add to global keys (run yourself, replacing with real value)
echo 'export DOTENV_PRIVATE_KEY_PROJECTNAME="your-key-here"' >> ~/.dotenvx/keys

# Delete the local .env.keys file (optional but recommended)
rm .env.keys
```

#### Why Global Keys?

| Approach | Pros | Cons |
|----------|------|------|
| `.env.keys` per repo | Simple initial setup | Must copy between machines, risk of accidental commit |
| `~/.dotenvx/keys` | Persists across all terminals/repos, never in git | One-time shell config needed |

The global approach means:
- All Conductor workspaces automatically have access
- No risk of accidentally committing keys
- Keys survive workspace archiving/deletion
- Works across all projects on your machine

### 6. Use in Applications

Run any command with decrypted environment:
```bash
dotenvx run -f .env.vibetracking -- npm run dev
dotenvx run -f .env.vibetracking -- python main.py
```

### 7. Share Across Machines

To use on another machine:
1. Clone the repo (includes encrypted `.env.vibetracking`)
2. Add the private key to `~/.dotenvx/keys` on the new machine
3. Run with `dotenvx run`

**Tip:** Share keys securely via a password manager, not via email/Slack/repos.

## Quick Reference Commands

| Task | Command |
|------|---------|
| Install dotenvx | `brew install dotenvx/brew/dotenvx` |
| Initialize vault | `dotenvx vault init` |
| Encrypt env file | `dotenvx encrypt -f .env.projectname` |
| Run with secrets | `dotenvx run -f .env.projectname -- <command>` |
| Decrypt (view) | `dotenvx decrypt -f .env.projectname` |
| Add to existing | Edit file, then `dotenvx encrypt -f .env.projectname` |
| Setup global keys | `mkdir -p ~/.dotenvx && touch ~/.dotenvx/keys && chmod 600 ~/.dotenvx/keys` |
| Add key globally | `echo 'export DOTENV_PRIVATE_KEY_X="..."' >> ~/.dotenvx/keys` |

## Example: Adding Secrets to a New Project

When user says "I need to add Supabase secrets to my vibetracking project":

**Respond with:**

> I'll guide you through adding encrypted secrets. Run these commands yourself (I won't ask for the actual values):
>
> **Step 1:** Create your env file with real values:
> ```bash
> cat > .env.vibetracking << 'EOF'
> NEXT_PUBLIC_SUPABASE_URL="YOUR_ACTUAL_URL_HERE"
> NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ACTUAL_KEY_HERE"
> EOF
> ```
>
> **Step 2:** Encrypt it:
> ```bash
> dotenvx encrypt -f .env.vibetracking
> ```
>
> **Step 3:** Add the key to your global keys file:
> ```bash
> # View the generated key
> cat .env.keys
>
> # Add to global keys (replace with actual key from above)
> echo 'export DOTENV_PRIVATE_KEY_VIBETRACKING="your-key-here"' >> ~/.dotenvx/keys
>
> # Remove local .env.keys (don't commit it)
> rm .env.keys
> ```
>
> **Step 4:** Commit the encrypted file:
> ```bash
> git add .env.vibetracking
> git commit -m "Add encrypted vibetracking secrets"
> ```
>
> Let me know when you've run these and I'll help verify it worked!

## Checks & Guardrails
- `.env.keys` must NEVER be committed to git - delete it after copying to `~/.dotenvx/keys`
- Verify `.gitignore` includes `.env.keys` as a safety net
- Store all keys in `~/.dotenvx/keys` with `chmod 600` permissions
- Share keys securely via password manager, never via chat/email/repos
- Test decryption works before deleting plaintext backups

## References
- [dotenvx Commands Reference](references/dotenvx-commands.md)
- [Vault Architecture](references/vault-architecture.md)
