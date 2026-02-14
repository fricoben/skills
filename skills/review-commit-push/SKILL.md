---
name: review-commit-push
description: >
  Fully agentic loop: commit, push, create PR, review using
  code-review-excellence, fix real bugs, wait for CI, diagnose and fix CI
  failures using GitHub logs, re-push, and merge once review is clean and CI
  is green. Trigger terms: review-commit-push, commit push review, agentic
  loop, PR review, CI fix, merge PR.
---

# Review, Commit, Push

Fully agentic loop: commit, push, create PR, review using code-review-excellence, fix real bugs, wait for CI, diagnose and fix CI failures using GitHub logs, re-push, and merge once review is clean and CI is green. Do not ask for user input unless you cannot confidently fix a bug or CI failure.

## Pre-flight Checks

1. Run `git branch --show-current` to get the current branch name.
   - If on `main` or `master`, STOP. Tell the user to create a feature branch first.
2. Run `git status` to verify there are changes to commit (staged, unstaged, or untracked).
   - If no changes and no existing PR, STOP. Nothing to do.

## Commit and Push

3. Stage changes: `git add -A`
4. Generate a commit message using conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`). Max 50 characters.
5. Commit: `git commit -m "<message>"`
6. Push: `git push -u origin HEAD`

## Create PR

7. Check if a PR already exists for the current branch: `gh pr view --json url 2>/dev/null`
   - If a PR already exists, skip to step 9.
8. Create PR: `gh pr create --base main --fill`

## Code Review (using code-review-excellence skill)

9. Get the full diff for the PR: `gh pr diff`
10. Review the diff following the **code-review-excellence** methodology:

    **Phase 1 — Context**: Read the PR description and understand the intent of the changes.

    **Phase 2 — High-level review**: Check architecture, file organization, and testing strategy.

    **Phase 3 — Line-by-line review** for **real bugs only**:
    - Logic errors or incorrect behavior
    - Missing null/edge case handling that would cause runtime failures
    - Security vulnerabilities (injection, auth bypass, data exposure)
    - Broken functionality (wrong API usage, type mismatches)
    - Race conditions, memory leaks, N+1 queries

    **Ignore**: style preferences, naming opinions, missing comments, "could be cleaner" suggestions, formatting.

    **Classify each finding using severity labels:**
    - 🔴 **[blocking]** — Must fix before merge (real bugs, security issues)
    - 🟡 **[important]** — Should fix (edge cases that cause runtime failures)
    - 🟢 **[nit]** — Ignore. Do not fix.

11. If there are **zero 🔴 blocking or 🟡 important** findings, skip to step 16 (CI check).
12. If you find bugs you cannot confidently fix, STOP. Report them with `file:line` and explain why. Do not continue.

## Fix and Re-push

13. Fix all 🔴 blocking and 🟡 important issues directly in the code.
14. Run the project's test suite if one exists:
    - Look for `package.json` → `bun test`
    - Look for `pytest.ini`, `pyproject.toml`, or `tests/` → `pytest`
    - Look for `Cargo.toml` → `cargo test`
    - Look for `go.mod` → `go test ./...`
    - If tests fail due to your fixes, fix them. If unrelated, note and continue.
15. If any files changed in steps 13–14:
    - `git add -A`
    - Commit with a message describing the fixes (e.g., `fix: handle null user in auth check`)
    - `git push`
    - Return to step 9 (re-review the updated PR diff AND wait for CI).

## CI Check and Diagnose

16. Wait for CI checks to complete: `gh pr checks --watch`
17. If all checks pass, skip to step 23.
18. If any check fails, diagnose using GitHub:
    a. List failed runs: `gh pr checks` and identify the failed check names.
    b. Find the run ID: `gh run list --branch $(git branch --show-current) --status failure --limit 5 --json databaseId,name,conclusion`
    c. View the failed run logs: `gh run view <run-id> --log-failed`
    d. If `--log-failed` output is too large or unclear, drill into specific jobs: `gh run view <run-id>` to list jobs, then `gh run view <run-id> --log --job <job-id>` for the failing job.
19. Analyze the log output to identify the root cause (test failures, lint errors, type errors, build failures, missing dependencies, etc.).
20. If the failure is something you cannot fix (infrastructure issue, flaky third-party service, permissions), STOP. Report the failure details and logs to the user.
21. Fix the identified issues directly in the code. Run local checks if possible (test suite, linter, type checker) to verify the fix before pushing.
22. Stage, commit (e.g., `fix: resolve CI lint errors`), and push:
    - `git add -A && git commit -m "<message>" && git push`
    - Return to step 9 (re-review the full PR diff AND wait for CI again).

## Merge

23. Confirm both conditions are met:
    - Code review has zero 🔴 blocking or 🟡 important findings.
    - All CI checks are green.
24. Merge: `gh pr merge --merge --delete-branch`
25. Report the PR URL and merge result to the user.
