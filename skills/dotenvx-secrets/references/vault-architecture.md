# dotenvx Vault Architecture

## File Structure

```
project/
├── .env.vibetracking      # Encrypted env file (commit this)
├── .env.production        # Encrypted env file (commit this)
├── .env.keys              # Private keys (NEVER commit)
└── .gitignore             # Must include .env.keys
```

## Encryption Flow

```
┌─────────────────┐
│ Plaintext .env  │
│ API_KEY="abc"   │
└────────┬────────┘
         │ dotenvx encrypt
         ▼
┌─────────────────────────────────┐
│ Encrypted .env                  │
│ API_KEY="encrypted:BO3Qm..."    │
└─────────────────────────────────┘
         │
         │ (generates)
         ▼
┌─────────────────────────────────┐
│ .env.keys                       │
│ DOTENV_PRIVATE_KEY_X="xyz..."   │
└─────────────────────────────────┘
```

## Key Naming Convention

Private keys in `.env.keys` follow this pattern:
- `DOTENV_PRIVATE_KEY` - Default key
- `DOTENV_PRIVATE_KEY_VIBETRACKING` - Key for `.env.vibetracking`
- `DOTENV_PRIVATE_KEY_PRODUCTION` - Key for `.env.production`

The suffix is derived from the filename (uppercase, underscores).

## Security Model

### What to Commit
- Encrypted `.env.*` files (safe to commit)
- `.env.vault` if using centralized vault

### What to NEVER Commit
- `.env.keys` (contains private decryption keys)
- Plaintext `.env` files with real secrets

### Sharing Keys
1. **Direct transfer**: Securely send `.env.keys` to team members
2. **Password manager**: Store keys in 1Password, Bitwarden, etc.
3. **CI secrets**: Set `DOTENV_PRIVATE_KEY_*` as environment variables

## Multi-Environment Setup

```bash
# Create environment-specific files
.env.development    # Local dev secrets
.env.staging        # Staging environment
.env.production     # Production secrets

# Each generates its own key in .env.keys:
DOTENV_PRIVATE_KEY_DEVELOPMENT="..."
DOTENV_PRIVATE_KEY_STAGING="..."
DOTENV_PRIVATE_KEY_PRODUCTION="..."
```

## Runtime Decryption

When running `dotenvx run -f .env.production -- command`:

1. dotenvx reads `.env.production` (encrypted)
2. Looks for `DOTENV_PRIVATE_KEY_PRODUCTION` in:
   - Current environment
   - `.env.keys` file
3. Decrypts values in memory
4. Injects into process environment
5. Runs the command

**Note:** Decrypted values never touch disk during `run`.

## Backup Strategy

The `.env.keys` file is critical. Recommended backup approaches:

1. **Password manager** (recommended)
   - Store entire `.env.keys` content as a secure note

2. **Encrypted cloud storage**
   - Encrypt with GPG before uploading

3. **Hardware security key**
   - For high-security environments

## Troubleshooting

### "Missing private key" error
```bash
# Check if key exists
cat .env.keys | grep DOTENV_PRIVATE_KEY

# Ensure correct naming
# File: .env.vibetracking
# Key:  DOTENV_PRIVATE_KEY_VIBETRACKING
```

### Can't decrypt after pulling repo
1. Ensure `.env.keys` is present
2. Check key matches the environment name
3. Verify key wasn't rotated

### Re-encrypting with new key
```bash
# Decrypt with old key
dotenvx decrypt -f .env.production > .env.production.tmp

# Remove old key from .env.keys
# (manually edit to remove DOTENV_PRIVATE_KEY_PRODUCTION)

# Re-encrypt (generates new key)
mv .env.production.tmp .env.production
dotenvx encrypt -f .env.production
```
