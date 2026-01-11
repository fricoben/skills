Fully agentic loop: review the current git changes for real potential bugs, fix any real bugs found, re-review, then commit and create a PR. Do not ask for user input unless you cannot confidently fix a real bug. Follow these steps:

1. Run `git status` to see what files have changed
2. Run `git diff` to understand the changes
3. Review the diff for real potential bugs only (logic errors, incorrect behavior, missing edge cases). Ignore style/formatting nits or "clean code" suggestions.
4. If you find a real potential bug, fix it directly, then re-run `git diff` and repeat the review step.
5. Repeat the review/fix loop until no real potential bugs remain.
6. If you cannot confidently fix a real bug, stop and report it with file/line references and why it is risky. Do not commit or push.
7. Once no real potential bugs are found, generate a concise, descriptive commit message that captures the essence of the changes
8. Stage all changes with `git add .`
9. Commit with the generated message
10. Push to the current branch: `git push origin HEAD`

## Create PR to main

11. Create a PR using `gh pr create --base main --fill` (auto-fills title and body from commit)
12. Report the PR URL to the user

Make sure to follow conventional commit format when appropriate (e.g., "feat:", "fix:", "docs:", etc.).
