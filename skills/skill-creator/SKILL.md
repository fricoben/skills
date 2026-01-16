---
name: skill-creator
description: >
  Guide for creating effective skills that extend Claude's capabilities. Trigger terms: create skill, new skill, skill creation, update skill, skill template, SKILL.md, skill design.
---

# Skill Creator

Create modular, self-contained packages that extend Claude's capabilities with specialized knowledge, workflows, and tools.

## Core Principles

### Concise is Key

The context window is a shared resource. **Default assumption: Claude is already very smart.** Only add context Claude doesn't already have.

### Skill Structure

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/     - Executable code
    ├── references/  - Documentation loaded as needed
    └── assets/      - Templates, images, fonts
```

#### SKILL.md

- **Frontmatter**: `name` and `description` fields. The description is the primary triggering mechanism.
- **Body**: Instructions for using the skill. Only loaded after the skill triggers.

#### scripts/

Executable code for deterministic tasks. Token efficient, may be executed without loading into context.

#### references/

Documentation loaded as needed. Keep SKILL.md lean by moving detailed info here.

#### assets/

Files used in output (templates, images) - not loaded into context.

## Creation Process

1. **Understand** the skill with concrete examples
2. **Plan** reusable contents (scripts, references, assets)
3. **Initialize** with `bin/new-skill.py <skill-name>` (requires `templates/skill-skeleton/`)
4. **Edit** the skill (implement resources and write SKILL.md)
5. **Validate** with `bin/validate-skills.py`
6. **Sync** with `bin/sync-skills.py` to deploy to `~/.claude/skills/` and `~/.codex/skills/`
7. **Iterate** based on real usage

### Frontmatter Guidelines

```yaml
name: my-skill
description: >
  What the skill does and when to use it. Include trigger
  contexts here - the body loads only after triggering.
```

### Design Patterns

- **Multi-step processes**: See `references/workflows.md`
- **Output formats**: See `references/output-patterns.md`

### Progressive Disclosure

Keep SKILL.md under 500 lines. Move variant-specific details to reference files:

```markdown
## Quick start
[Core workflow here]

## Advanced features
- **Form filling**: See references/forms.md
- **API reference**: See references/api.md
```

## What NOT to Include

Do not create auxiliary files like README.md, CHANGELOG.md, INSTALLATION_GUIDE.md. The skill should only contain what an AI agent needs to do the job.
