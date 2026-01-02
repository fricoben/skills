---
name: bugbot-review
description: >
  Reviews and resolves review threads on open pull requests, including Bugbot findings, fixing valid issues and responding when not applicable.
  Trigger terms: bugbot, review issues, bot review, github action review, unresolved review threads, review conversations.
---

## When to Use
- You are asked to check or address review findings on a pull request.
- A PR shows unresolved review threads or conversations (from Bugbot or other reviewers).
- You need to verify reported issues and act on them.

## When NOT to Use
- The request is a general code review unrelated to existing review threads.
- There is no open pull request to inspect.

## Inputs the Agent Should Ask For
- PR number or branch name if there are multiple open PRs.
- Whether you should only respond or also make code changes (if unclear).

## Outputs / Definition of Done
- All review threads and conversations are resolved:
  - Valid issues are fixed in code (with tests if warranted).
  - Invalid/non-applicable issues have a concise reply explaining why.
- Bugbot checks are no longer running and no new unresolved threads appear.
- Changes (if any) are committed and pushed.
- The agent continues the wait/check loop without asking for confirmation until the conditions above are satisfied.

## Procedure
1. Ensure the repo context is correct and authenticated with `gh`.
2. Locate the open PR:
   - Use `gh pr status` or `gh pr list --state open` to identify the PR.
   - If multiple PRs match, ask for the target PR number.
   - Check out the PR branch with `gh pr checkout <pr>` to ensure changes are made on the correct branch.
3. Inspect review activity on the PR:
   - Use GraphQL to list review threads because `gh pr view` does not expose `reviewThreads`:
     - `gh api graphql -F owner=<owner> -F name=<repo> -F number=<pr> -f query='query($owner:String!, $name:String!, $number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{id isResolved isOutdated comments(first:50){nodes{id author{login} body}}} pageInfo{hasNextPage endCursor}}}}}'`
   - If `pageInfo.hasNextPage` is true, repeat the query with an `after` cursor until all threads are collected (do not assume 100 is enough).
   - Focus on unresolved review threads (`isResolved=false`) which are the resolvable items tied to specific code lines.
4. For each unresolved review thread (Bugbot or other reviewers):
   - Verify the issue exists (read code, run targeted checks/tests if needed).
   - If valid, fix the issue and update tests or add a short code comment if clarity is needed.
   - If not valid or not applicable, reply in the same thread explaining why.
   - Resolve the review thread explicitly via GraphQL:
     - `gh api graphql -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{isResolved}}}' -F threadId=<threadId>`
   - Note: Top-level PR comments (from `gh pr view --json comments`) are not review threads and cannot be resolved via this mutation. Only address review threads from the GraphQL query above.
5. Re-check for any remaining unresolved items (repeat step 3).
6. If there are uncommitted changes (`git status --porcelain` is non-empty), commit and push them.
7. Check whether Bugbot is currently running:
   - Use `gh pr checks <pr>` or `gh run list --workflow bugbot` to see active runs.
8. Re-check for unresolved review threads (repeat step 3), then evaluate the current state:
   - If Bugbot is running, wait 5 minutes and repeat steps 3-8.
   - If Bugbot is not running but unresolved review threads remain, repeat steps 3-8.
   - If Bugbot is not running and no unresolved review threads remain, you are done.
9. Do not ask the user whether to continue looping; keep looping until done unless you need missing inputs (e.g., multiple PRs) or permissions.

## Checks & Guardrails
- Do not skip verification; confirm each report against the codebase.
- Keep replies factual and concise; avoid arguing without evidence.
- Prefer minimal fixes that address the reported issue directly.
- If a response needs extra context, add a brief code comment to prevent repeat flags.
- Ensure review threads are actually marked resolved in GitHub (not just replied to).
- Only consider the work done when Bugbot is no longer running and no unresolved threads remain.
- Use `git status --porcelain` to decide whether there are uncommitted changes to commit.
- Do not prompt the user to re-run checks; automatically continue the wait/check loop until completion.

## References
- GitHub CLI: `gh pr view`, `gh pr checks`, `gh run list`
