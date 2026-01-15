---
name: agent-repo-audit
description: >
  Audit a repository for agent-native development readiness. Use when assessing how well a codebase supports AI-assisted workflows, multi-agent collaboration, or when preparing a team for agent-first development. Analyzes documentation, skills/commands, agent interoperability, testing, and monorepo structure.
  Trigger terms: audit, agent-native, agent readiness, repo audit, codebase audit, AI-assisted, multi-agent, agent-first, documentation audit, skills audit, testing audit, monorepo audit.
---

# Agent-Native Repo Audit

Audit a repository to assess readiness for agent-native development and produce an actionable report.

## Three Pillars Framework

Agent-native development rests on three pillars:

1. **Set Expectations** (human prompt engineering) — How humans communicate with agents
2. **Equip with Tools** (repo prep) — Documentation, skills, commands that agents consume
3. **Iterate on Workflows** (implicit) — Refine based on what works; no upfront action items

**This audit focuses on Pillar 2.** Pillar 3 is implicit—teams refine skills through usage.

## Philosophy

Agent-native codebases should be **runtime-agnostic**—designed to work with any AI coding agent (Claude Code, Codex, Cursor, Aider, etc.) rather than locked to a single tool. Key principles:

1. **Canonical skill definitions** synced to multiple runtimes
2. **Documentation-first context** that any agent can consume
3. **Commands/prompts** for common workflows

## Process

1. Read the detailed checklist in `references/audit-checklist.md`
2. Systematically analyze the repository against each section
3. Generate a report following the output format below

## Output Format

```markdown
# Agent-Native Audit Report: [REPO NAME]

## Executive Summary

**Three Pillars Assessment:**
| Pillar | Focus | Status |
|--------|-------|--------|
| 1. Set Expectations | Human prompt engineering | (out of scope) |
| 2. Equip with Tools | Repo prep | 🔴/🟡/🟢 |
| 3. Iterate on Workflows | Implicit | (no upfront action) |

[2-3 sentences: overall Pillar 2 readiness + top priorities]

## 1. Documentation & Context
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:** (gaps only)
- [ ] [missing item]
- [ ] ...

## 2. Skills & Commands
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:** (gaps only)
- [ ] [missing item]
- [ ] ...

## 3. Testing & Validation
**Rating:** 🔴/🟡/🟢
**Current State:** [what exists]
**Gaps:** [what's missing]
**Recommendations:** (gaps only)
- [ ] [missing item]
- [ ] ...

## 4. Code Structure & Multi-Agent Readiness
**Rating:** 🔴/🟡/🟢
**Package Map:** [table/list of packages]
**Coupling Analysis:** [tightly coupled packages]
**Multi-Agent Readiness:** [can agents work in parallel?]
**Recommendations:** (gaps only)
- [ ] [missing item]
- [ ] ...

## Priority Action Plan

| Priority | Action |
|----------|--------|
| P0 | Create CLAUDE.md + AGENTS.md |
| P1 | Create skills/ directory |
| P2 | Create .claude/commands/ |
| P3 | Create sync script |

(Adjust based on actual gaps found)
```

## Rating Criteria

- 🔴 **Not Ready**: Missing critical elements, significant work needed
- 🟡 **Partial**: Some elements exist but gaps remain
- 🟢 **Ready**: Well-configured for agent workflows
