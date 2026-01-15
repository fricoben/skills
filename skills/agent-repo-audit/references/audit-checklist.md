# Agent-Native Audit Checklist

Detailed checklist for evaluating repository readiness for agent-native development with a focus on **runtime portability**—ensuring the codebase works with any AI coding agent.

## 1. Documentation & Context

### Project Overview
- [ ] `README.md` exists with clear project description
- [ ] Architecture overview documented (diagrams, high-level design)
- [ ] Getting started guide with prerequisites and setup steps
- [ ] Technology stack documented (languages, frameworks, key dependencies)

### Agent Instructions
- [ ] `CLAUDE.md` exists (Claude Code instructions)
- [ ] `AGENTS.md` exists (Codex/multi-agent instructions)
- [ ] Instructions are runtime-agnostic (not locked to a specific agent)
- [ ] Codebase conventions documented (naming, file structure, patterns)
- [ ] Common pitfalls and gotchas documented

### API & Interface Documentation
- [ ] API endpoints documented (REST, GraphQL, etc.)
- [ ] Data models and schemas documented
- [ ] Environment variables documented with descriptions
- [ ] Configuration options documented

### Maintenance Documentation
- [ ] Troubleshooting guide for common issues
- [ ] Deployment and release process documented

## 2. Skills & Runtime Portability

### Skill Definition Format
- [ ] Skills directory exists (`skills/`)
- [ ] Skills use portable format (YAML frontmatter + markdown body)
- [ ] Each skill has required fields: `name`, `description` with trigger terms
- [ ] Skills stored in canonical location (`skills/<name>/SKILL.md`)
- [ ] Supporting docs in `references/` subdirectory (not inline)

### Multi-Runtime Deployment
- [ ] Sync script exists for deploying to multiple runtimes
- [ ] Skills deployable to Claude Code (`~/.claude/skills/`)
- [ ] Skills deployable to Codex (`~/.codex/skills/`)
- [ ] `--dry-run` option available for preview

### Secret Management
- [ ] Environment variable placeholders used (`${VAR_NAME}` pattern)
- [ ] Secrets not hardcoded in skill definitions
- [ ] `.env.keys` and sensitive files gitignored

### Developer Commands
- [ ] Build commands documented (`npm run build`, `make`, etc.)
- [ ] Test commands documented with options
- [ ] Lint/format commands available
- [ ] Development server commands documented

## 3. Commands & Prompts

Commands (Claude Code) and prompts (Codex) automate common workflows.

### Comparison Table

| Feature | Claude Code | Codex |
|---------|-------------|-------|
| Location | `.claude/commands/*.md` | `~/.codex/prompts/*.md` |
| Scope | Project or global (`~/.claude/commands/`) | Global only |
| Placeholders | `$ARGUMENTS`, `$1`-`$9` | `$ARGUMENTS`, `$1`-`$9`, named |
| Invocation | `/command-name` | `/prompt-name` |

### Audit Items
- [ ] `.claude/commands/` directory exists (Claude Code)
- [ ] Commands exist for common workflows (build, test, deploy, debug)
- [ ] Makefile targets identified that could become commands
- [ ] Commands use appropriate placeholders for flexibility

### Makefile-to-Command Opportunities
When auditing, check for:
- `make test` → `/test` command
- `make build` → `/build` command
- `make lint` → `/lint` command
- `make deploy` → `/deploy` command

## 4. Testing & Validation

### Test Infrastructure
- [ ] Unit tests exist and pass
- [ ] Integration tests exist (if applicable)
- [ ] Tests can be run locally
- [ ] Test commands are simple and documented
- [ ] Test data/fixtures available

### Quality Gates
- [ ] Linting rules configured and documented
- [ ] Security scanning enabled (no hardcoded secrets)
- [ ] CI pipeline defined (GitHub Actions, GitLab CI, etc.)

## 5. Code Structure & Multi-Agent Readiness

### Package Organization
- [ ] Clear package boundaries defined
- [ ] Package dependencies explicitly declared
- [ ] Shared code properly extracted to common packages
- [ ] Package responsibilities documented

### Dependency Management
- [ ] Workspace configuration (npm workspaces, pnpm, turborepo, etc.)
- [ ] Internal dependencies use workspace protocol
- [ ] Lock file committed and maintained

### Build System
- [ ] Incremental builds supported
- [ ] Build caching configured
- [ ] Parallel builds possible

### Multi-Agent Parallel Work
- [ ] Packages can be worked on independently
- [ ] Clear ownership boundaries for packages
- [ ] Minimal circular dependencies
- [ ] Changes in one package don't cascade across all packages

## Rating Guidelines

### 🔴 Not Ready
- Missing 50%+ of items in a category
- Critical items missing (no README, no agent instructions, no tests)
- No skills/ directory or sync mechanism

### 🟡 Partial
- 50-80% of items present in a category
- Core items exist but gaps remain
- Some runtime portability but not complete

### 🟢 Ready
- 80%+ of items present in a category
- All critical items exist
- Full runtime portability with sync mechanisms
