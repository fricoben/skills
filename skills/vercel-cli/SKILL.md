---
name: vercel-cli
description: >
  Manage Vercel projects, deployments, and environment variables using the Vercel CLI.
  Use for listing projects, checking deployment status and build logs, viewing runtime logs,
  managing environment variables (add, update, remove, list), connecting Git repos, promoting
  deployments, and inspecting production state. Trigger terms: vercel, vercel cli, deployment,
  deploy, environment variables, env vars, vercel projects, build logs, runtime logs, vercel logs,
  production deployment, vercel env, vercel inspect, vercel promote, vercel rollback.
allowed-tools: Bash(vercel:*)
---

# Vercel CLI

Manage Vercel projects, deployments, and environment variables from the command line.

## Prerequisites

Ensure `vercel` is installed and authenticated:

```bash
vercel --version   # Check installation
vercel whoami      # Check authentication
vercel switch      # Switch team scope if needed
```

## Important: Never Create New Projects

**Do NOT create a new Vercel project** unless the user explicitly asks for it. The Vercel project almost always already exists. To find the correct project, check in this order:

1. **Local config files** — Look for `agent.md` or `cloud.md` in the repository (or `.context/` directory) for the Vercel project name/ID.
2. **Vercel LFG Labs org** — Search projects in the LFG Labs team: `vercel project ls --scope lfg-labs`
3. **Vercel fricoben org** — Search projects in the fricoben scope: `vercel project ls --scope fricoben`

If you find a matching project, use `vercel link --yes` to link the local directory to it instead of creating a new one.

## Global Options

These flags work with most commands:

| Flag | Short | Purpose |
|------|-------|---------|
| `--token <t>` | `-t` | Auth token (for CI/CD) |
| `--scope <slug>` | `-S` | Team scope |
| `--project <name>` | | Target project by name or ID |
| `--cwd <path>` | | Working directory |
| `--debug` | `-d` | Verbose output |
| `--no-color` | | Disable color/emoji |
| `--team <slug>` | `-T` | Team slug or ID |

## Projects

### List all projects

```bash
vercel project ls
vercel project ls --json          # JSON output for parsing
vercel project ls --update-required  # Projects needing updates
```

### Inspect a project

```bash
vercel project inspect <project-name>
```

### Link local directory to project

```bash
vercel link
vercel link --yes  # Skip confirmation
```

### Git connection (find projects connected to GitHub)

```bash
vercel git connect       # Connect current repo to project
vercel git disconnect    # Disconnect Git provider
vercel git connect --yes # Skip confirmation
```

## Environment Variables

### List variables

```bash
vercel env ls                              # All environments
vercel env ls production                   # Production only
vercel env ls preview                      # Preview only
vercel env ls development                  # Development only
vercel env ls preview <git-branch>         # Branch-specific
```

### Add a variable

```bash
vercel env add <NAME> <environment>        # Interactive value prompt
vercel env add <NAME> production preview   # Multiple environments
echo "value" | vercel env add <NAME> production  # Pipe value
vercel env add <NAME> production < file.txt      # From file
vercel env add <NAME> --sensitive          # Mark as sensitive
vercel env add <NAME> production --force   # Overwrite without prompt
```

### Update a variable

```bash
vercel env update <NAME> production
cat file.txt | vercel env update <NAME> preview
vercel env update <NAME> production --yes  # Skip confirmation
```

### Remove a variable

```bash
vercel env rm <NAME> production
vercel env rm <NAME> --yes                 # Skip confirmation
```

### Pull variables to local file

```bash
vercel env pull                            # Pull to .env
vercel env pull .env.local                 # Custom filename
vercel env pull --environment=production   # Specific environment
vercel env pull --environment=preview --git-branch=feature-x
```

### Run command with env vars (no file written)

```bash
vercel env run -- <command>
vercel env run -- next dev
vercel env run -e production -- next build
vercel env run -e preview --git-branch feature-x -- next dev
```

## Deployments

### List deployments

```bash
vercel list                                # Current project
vercel list <project-name>                 # Specific project
vercel list --prod                         # Production only
vercel list --status READY                 # By status
vercel list --status READY,BUILDING        # Multiple statuses
vercel list --environment=staging          # Custom environment
vercel list --meta githubCommitSha=<sha>   # Filter by metadata
```

Status values: `BUILDING`, `ERROR`, `INITIALIZING`, `QUEUED`, `READY`, `CANCELED`

### Deploy

```bash
vercel                                     # Preview deployment
vercel --prod                              # Production deployment
vercel --prod --skip-domain                # Prod without domain alias
vercel --force                             # Skip build cache
vercel --logs                              # Print build logs
vercel --no-wait                           # Don't wait for completion
vercel --env KEY=value                     # Runtime env var
vercel --build-env KEY=value               # Build-time env var
vercel --target=staging                    # Custom environment
vercel --meta KEY=value                    # Add metadata
```

### Inspect a deployment

```bash
vercel inspect <deployment-url-or-id>             # Deployment info
vercel inspect <deployment-url-or-id> --logs      # Build logs
vercel inspect <deployment-url-or-id> --wait      # Wait for completion
vercel inspect <deployment-url-or-id> --logs --wait  # Stream build logs
```

### Runtime logs

```bash
vercel logs <deployment-url-or-id>           # Stream runtime logs (5 min)
vercel logs <deployment-url-or-id> --json    # JSON format for piping
vercel logs <url> --json | jq 'select(.level == "error")'  # Filter errors
```

Runtime logs stream for up to 5 minutes from when the command starts.

### Promote a deployment to production

```bash
vercel promote <deployment-url-or-id>
vercel promote <deployment-url-or-id> --timeout=5m
vercel promote status                       # Check promotion status
vercel promote status <project-name>
```

### Rollback production

```bash
vercel rollback                             # Rollback to previous
vercel rollback <deployment-url-or-id>      # Rollback to specific
vercel rollback status                      # Check rollback status
```

### Redeploy

```bash
vercel redeploy <deployment-url-or-id>      # Rebuild and deploy
```

## Common Workflows

### Check production deployment state

```bash
vercel list --prod                          # Find latest prod deployment
vercel inspect <deployment-url> --logs      # View its build logs
vercel logs <deployment-url>                # Stream runtime logs
```

### Update env var and redeploy

```bash
echo "new-value" | vercel env update API_KEY production --yes
vercel --prod                               # Trigger new prod deployment
```

### Find project connected to GitHub

```bash
vercel project ls --json | jq '.[] | select(.link.type == "github")'
vercel project inspect <project-name>       # Shows Git connection details
```

### Debug a failed deployment

```bash
vercel list --status ERROR                  # Find errored deployments
vercel inspect <deployment-url> --logs      # View build logs
vercel logs <deployment-url> --json         # Check runtime logs
```

## Domains & DNS

```bash
vercel domains ls                           # List domains
vercel domains add <domain> <project>       # Add domain
vercel domains rm <domain>                  # Remove domain
vercel dns ls <domain>                      # List DNS records
```

## Teams

```bash
vercel teams list                           # List teams
vercel switch <team-name>                   # Switch active team
vercel whoami                               # Current user/team
```

## Cache Management

```bash
vercel cache purge                          # Purge all cache
vercel cache purge --type cdn               # CDN cache only
vercel cache purge --type data              # Data cache only
```
