# Agent-Native Audit Checklist

Detailed checklist for evaluating repository readiness for agent-native development with a focus on **runtime portability**—ensuring the codebase works with any AI coding agent.

## 1. Documentation & Context

### Project Overview
- [ ] `README.md` exists with clear project description
- [ ] Architecture overview documented (diagrams, high-level design)
- [ ] Getting started guide with prerequisites and setup steps
- [ ] Technology stack documented (languages, frameworks, key dependencies)

### Agent-Specific Documentation
- [ ] Agent instructions file exists (`.claude/CLAUDE.md`, `AGENTS.md`, or similar)
- [ ] Instructions are runtime-agnostic (not locked to a specific agent)
- [ ] Codebase conventions documented (naming, file structure, patterns)
- [ ] Common pitfalls and gotchas documented
- [ ] Decision records (ADRs) for major architectural choices

### API & Interface Documentation
- [ ] API endpoints documented (REST, GraphQL, etc.)
- [ ] Data models and schemas documented
- [ ] Environment variables documented with descriptions
- [ ] Configuration options documented

### Maintenance Documentation
- [ ] `CONTRIBUTING.md` with contribution guidelines
- [ ] `CHANGELOG.md` tracking version history
- [ ] Troubleshooting guide for common issues
- [ ] Deployment and release process documented

## 2. Skills & Runtime Portability

### Skill Definition Format
- [ ] Skills use portable format (YAML frontmatter + markdown body)
- [ ] Each skill has required fields: `name`, `description` with trigger terms
- [ ] Skills stored in canonical location (`skills/<name>/SKILL.md`)
- [ ] Supporting docs in `references/` subdirectory (not inline)
- [ ] Skill content within size limits (< 2500 words, < 15KB)

### Multi-Runtime Deployment
- [ ] Sync mechanism exists for deploying to multiple runtimes
- [ ] Skills deployable to Claude Code (`~/.claude/skills/`)
- [ ] Skills deployable to Codex (`~/.codex/skills/`)
- [ ] Sync script validates skills before deployment
- [ ] `--dry-run` option available for preview

### MCP Server Configuration
- [ ] MCP servers defined in canonical location (`mcp/servers.json` or similar)
- [ ] MCP configs syncable to Claude Code (`~/.claude.json`)
- [ ] MCP configs syncable to Codex (`~/.codex/config.toml`)
- [ ] Server definitions are runtime-agnostic

### Secret Management
- [ ] Environment variable placeholders used (`${VAR_NAME}` pattern)
- [ ] Secrets not hardcoded in skill definitions
- [ ] Placeholder substitution during sync (e.g., via `dotenvx`)
- [ ] `.env.keys` and sensitive files gitignored
- [ ] Documentation for secret injection workflow

### Developer Commands
- [ ] Build commands documented (`npm run build`, `make`, etc.)
- [ ] Test commands documented with options
- [ ] Lint/format commands available
- [ ] Development server commands documented
- [ ] Skill sync commands documented

### CI/CD Integration
- [ ] CI pipeline defined (GitHub Actions, GitLab CI, etc.)
- [ ] Skill validation in CI (frontmatter, size, unsafe patterns)
- [ ] Pipeline stages clearly documented
- [ ] Required checks for PRs documented

## 3. Testing & Validation

### Test Coverage
- [ ] Unit tests exist and pass
- [ ] Integration tests exist
- [ ] E2E tests exist (if applicable)
- [ ] Test coverage metrics tracked

### Test Infrastructure
- [ ] Tests can be run locally
- [ ] Test commands are simple and documented
- [ ] Test data/fixtures available
- [ ] Mocking patterns documented

### Skill Validation
- [ ] Frontmatter validation (required fields: name, description)
- [ ] Folder name matches frontmatter name
- [ ] Trigger terms present in description
- [ ] Unsafe pattern detection (API keys, secrets)
- [ ] Size limit enforcement

### Quality Gates
- [ ] Minimum coverage thresholds defined
- [ ] Linting rules configured and documented
- [ ] Security scanning enabled (no hardcoded secrets)
- [ ] Dependency vulnerability scanning enabled

## 4. Code Structure & Multi-Agent Readiness

### Package Organization
- [ ] Clear package boundaries defined
- [ ] Package dependencies explicitly declared
- [ ] Shared code properly extracted to common packages
- [ ] Package responsibilities documented

### Dependency Management
- [ ] Workspace configuration (npm workspaces, pnpm, turborepo, etc.)
- [ ] Internal dependencies use workspace protocol
- [ ] Version management strategy documented
- [ ] Lock file committed and maintained

### Build System
- [ ] Incremental builds supported
- [ ] Build caching configured
- [ ] Dependency graph can be computed
- [ ] Parallel builds possible

### Multi-Agent Parallel Work
- [ ] Packages can be worked on independently
- [ ] Clear ownership boundaries for packages
- [ ] Minimal circular dependencies
- [ ] Changes in one package don't cascade across all packages
- [ ] Shared context mechanisms (`.context/` directories)
- [ ] Agents can coordinate via shared files

## Rating Guidelines

### 🔴 Not Ready
- Missing 50%+ of items in a category
- Critical items missing (no README, no tests, no build commands)
- Skills locked to single runtime with no portability
- Hardcoded secrets in skill definitions

### 🟡 Partial
- 50-80% of items present in a category
- Core items exist but gaps remain
- Some runtime portability but not complete
- Agents can work but may need clarification

### 🟢 Ready
- 80%+ of items present in a category
- All critical items exist
- Full runtime portability with sync mechanisms
- Agents can work effectively with minimal friction
