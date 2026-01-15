# Agent-Native Audit Checklist

Detailed checklist for evaluating repository readiness for agent-native development.

## 1. Documentation & Context

### Project Overview
- [ ] `README.md` exists with clear project description
- [ ] Architecture overview documented (diagrams, high-level design)
- [ ] Getting started guide with prerequisites and setup steps
- [ ] Technology stack documented (languages, frameworks, key dependencies)

### Agent-Specific Documentation
- [ ] `CLAUDE.md` or `.claude/` directory exists with agent instructions
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

## 2. Skills, Commands & Agent Interoperability

### Custom Skills
- [ ] Project-specific skills defined (`.claude/skills/` or similar)
- [ ] Skills have clear triggers and descriptions
- [ ] Skills include procedure steps and expected outputs
- [ ] Skills reference supporting documentation when needed

### Developer Commands
- [ ] Build commands documented (`npm run build`, `make`, etc.)
- [ ] Test commands documented with options
- [ ] Lint/format commands available
- [ ] Development server commands documented

### CI/CD Integration
- [ ] CI pipeline defined (GitHub Actions, GitLab CI, etc.)
- [ ] Pipeline stages clearly documented
- [ ] Required checks for PRs documented
- [ ] Deployment pipelines documented

### Agent Interoperability
- [ ] MCP servers configured if applicable
- [ ] Tool configurations documented
- [ ] Environment setup for agents documented
- [ ] Shared context mechanisms (`.context/` directories, etc.)

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

### Validation Hooks
- [ ] Pre-commit hooks configured (linting, formatting)
- [ ] Pre-push hooks configured (tests, type-checking)
- [ ] PR checks automated
- [ ] Type checking enabled and passing

### Quality Gates
- [ ] Minimum coverage thresholds defined
- [ ] Linting rules configured and documented
- [ ] Security scanning enabled
- [ ] Dependency vulnerability scanning enabled

## 4. Code Structure (Monorepo)

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

### Multi-Agent Readiness
- [ ] Packages can be worked on independently
- [ ] Clear ownership boundaries for packages
- [ ] Minimal circular dependencies
- [ ] Changes in one package don't require changes across all packages

## Rating Guidelines

### 🔴 Not Ready
- Missing 50%+ of items in a category
- Critical items missing (no README, no tests, no build commands)
- Agents would struggle to understand or work in the codebase

### 🟡 Partial
- 50-80% of items present in a category
- Core items exist but gaps remain
- Agents can work but may need clarification or make mistakes

### 🟢 Ready
- 80%+ of items present in a category
- All critical items exist
- Agents can work effectively with minimal friction
