---
name: agent-repo-audit
description: >
  Audit a repository for agent-native development readiness. Use when assessing how well a codebase supports AI-assisted workflows, multi-agent collaboration, or when preparing a team for agent-first development. Analyzes documentation, skills/commands, agent interoperability, testing, and monorepo structure.
  Trigger terms: audit, agent-native, agent readiness, repo audit, codebase audit, AI-assisted, multi-agent, agent-first, documentation audit, skills audit, testing audit, monorepo audit.
---

# Agent-Native Repo Audit

Audit a repository to assess readiness for agent-native development and produce an actionable report.

## Philosophy

Agent-native codebases should be **runtime-agnostic**—designed to work with any AI coding agent (Claude Code, Codex, Cursor, Aider, etc.) rather than locked to a single tool. Key principles:

1. **Canonical skill definitions** synced to multiple runtimes
2. **Shared MCP server configurations** deployable across tools
3. **Documentation-first context** that any agent can consume
4. **Environment variable substitution** for secrets across deployments

## Process

1. Read the detailed checklist in `references/audit-checklist.md`
2. Systematically analyze the repository against each section
3. Generate a report following the output format below

## Output Format

```markdown
# Agent-Native Audit Report: [REPO NAME]

## Executive Summary
[2-3 sentences: overall readiness + top 3 priorities]

## 1. Documentation & Context
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:**
- [ ] [specific action]
- [ ] ...

## 2. Skills & Runtime Portability
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:**
- [ ] [specific action]
- [ ] ...

## 3. Testing & Validation
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:**
- [ ] [specific action]
- [ ] ...

## 4. Code Structure & Multi-Agent Readiness
**Rating:** 🔴/🟡/🟢
**Package Map:** [table/list of packages]
**Coupling Analysis:** [tightly coupled packages]
**Multi-Agent Readiness:** [can agents work in parallel?]
**Recommendations:**
- [ ] [specific action]
- [ ] ...

## Priority Action Plan
1. [Highest impact]
2. [Second priority]
3. [Third priority]
```

## Rating Criteria

- 🔴 **Not Ready**: Missing critical elements, significant work needed
- 🟡 **Partial**: Some elements exist but gaps remain
- 🟢 **Ready**: Well-configured for agent workflows
