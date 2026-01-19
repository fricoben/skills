Fully agentic loop: review current git changes for real bugs, fix them, run tests, commit, create PR, wait for CI, and merge. Do not ask for user input unless you cannot confidently fix a bug.

## Pre-flight Checks

1. Run `git branch --show-current` to get the current branch name.
   - If on `main` or `master`, STOP. Tell the user to create a feature branch first.
2. Run `git status` to verify there are changes to review.
   - If no changes, STOP. Nothing to do.

## Review Loop

3. Run `git diff` (staged and unstaged) to see all changes.
4. Review the diff for **real bugs only**:
   - Logic errors or incorrect behavior
   - Missing null/edge case handling that would cause runtime failures
   - Security vulnerabilities (injection, auth bypass, data exposure)
   - Broken functionality (wrong API usage, type mismatches)

   **Ignore**: style preferences, naming opinions, missing comments, "could be cleaner" suggestions.

5. If you find a real bug you can confidently fix, fix it directly.
6. After any fix, re-run `git diff` and restart from step 4. Loop until zero real bugs remain.
7. If you find a bug you cannot confidently fix, STOP. Report it with file:line and explain why it's risky. Do not continue.

## Test Verification

8. Detect and run the project's test suite:
   - Look for `package.json` → `npm test` or `bun test`
   - Look for `pytest.ini`, `pyproject.toml`, or `tests/` → `pytest`
   - Look for `Cargo.toml` → `cargo test`
   - Look for `go.mod` → `go test ./...`
   - If no test runner found, skip this step.
9. If tests fail, analyze the failure. If it's caused by your changes, fix it and return to step 3.
10. If tests fail for reasons unrelated to your changes, note it but continue.

## Commit and Push

11. Generate a commit message using conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).
12. Stage changes: `git add -A`
13. Commit: `git commit -m "<message>"`
14. Push: `git push -u origin HEAD`

## Create PR and Merge

15. Create PR: `gh pr create --base main --fill`
16. Wait for CI checks to complete: `gh pr checks --watch`
    - If checks fail, analyze the failure. If fixable, fix locally and return to step 3.
    - If checks fail for unfixable reasons, STOP. Report the failure to the user.
17. Once all checks pass, merge: `gh pr merge --merge --delete-branch`
18. Report the PR URL and merge result to the user.
