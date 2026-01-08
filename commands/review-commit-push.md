Fully agentic loop: review the current git changes for real potential bugs, fix any real bugs found, re-review, then commit all changes and push to main. Do not ask for user input unless you cannot confidently fix a real bug. Follow these steps:

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

## Merge to main (without checkout)

11. Fetch latest main: `git fetch origin main`
12. Check if feature branch can be fast-forwarded to main:
    - Run: `git merge-base --is-ancestor origin/main HEAD`
    - If exit code 0: Fast-forward is possible, proceed to step 15
    - If exit code 1: Main has diverged, need to rebase (step 13)
13. Rebase onto main to handle conflicts:
    - Run: `git rebase origin/main`
    - If conflicts occur, resolve them file by file, then `git rebase --continue`
    - After successful rebase, force-push your branch: `git push origin HEAD --force-with-lease`
14. Re-run the review (steps 2-6) to ensure rebase didn't introduce issues
15. Push feature branch to main: `git push origin HEAD:main`
16. Confirm success: `git log origin/main -1 --oneline`

Make sure to follow conventional commit format when appropriate (e.g., "feat:", "fix:", "docs:", etc.).
