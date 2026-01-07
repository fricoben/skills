---
name: user-preferences
description: >
  Global user preferences and environment context. Automatically loaded for all projects.
  Trigger terms: preferences, settings, environment, config, bun, package manager.
---

## Package Manager

**Use `bun` instead of `npm`, `pnpm`, or `yarn`.**

- Install dependencies: `bun install`
- Run scripts: `bun run <script>`
- Add packages: `bun add <package>`
- Add dev dependencies: `bun add -d <package>`
- Remove packages: `bun remove <package>`
- Execute binaries: `bunx <command>`

## Runtime

- Prefer `bun` as the JavaScript/TypeScript runtime when applicable
- Use `bun test` for running tests (unless the project explicitly uses another test runner)
