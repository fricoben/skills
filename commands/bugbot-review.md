---
description: Review and resolve Bugbot/review threads on the current PR
---

Review and resolve all unresolved review threads on the current pull request, including Bugbot findings. Fix valid issues and respond to non-applicable ones.

## Procedure

1. Ensure the repo context is correct and authenticated with `gh`.

2. Locate the open PR:
   - Use `gh pr status` or `gh pr list --state open` to identify the PR.
   - If multiple PRs match, ask for the target PR number.
   - Check out the PR branch with `gh pr checkout <pr>` to ensure changes are made on the correct branch.

3. Inspect review activity on the PR:
   - Use GraphQL to list review threads because `gh pr view` does not expose `reviewThreads`:
     ```
     gh api graphql -F owner=<owner> -F name=<repo> -F number=<pr> -f query='query($owner:String!, $name:String!, $number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){reviewThreads(first:100){nodes{id isResolved isOutdated comments(first:50){nodes{id author{login} body}}} pageInfo{hasNextPage endCursor}}}}}'
     ```
   - If `pageInfo.hasNextPage` is true, repeat the query with an `after` cursor until all threads are collected.
   - Focus on unresolved review threads (`isResolved=false`).

4. For each unresolved review thread:
   - Verify the issue exists (read code, run targeted checks/tests if needed).
   - If valid, fix the issue and update tests or add a short code comment if clarity is needed.
   - If not valid or not applicable, reply in the same thread explaining why.
   - Resolve the review thread explicitly via GraphQL:
     ```
     gh api graphql -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{isResolved}}}' -F threadId=<threadId>
     ```

5. Re-check for any remaining unresolved items (repeat step 3).

6. If there are uncommitted changes (`git status --porcelain` is non-empty), commit and push them.

7. Check whether Bugbot is currently running:
   - Use `gh pr checks <pr>` or `gh run list --workflow bugbot` to see active runs.

8. Re-check for unresolved review threads, then evaluate:
   - If Bugbot is running, wait 5 minutes and repeat steps 3-8.
   - If Bugbot is not running but unresolved threads remain, repeat steps 3-8.
   - If Bugbot is not running and no unresolved threads remain, you are done.

9. Keep looping until done without asking for confirmation unless you need missing inputs.

## Guardrails

- Do not skip verification; confirm each report against the codebase.
- Keep replies factual and concise.
- Prefer minimal fixes that address the reported issue directly.
- Ensure review threads are actually marked resolved in GitHub (not just replied to).
- Only consider the work done when Bugbot is no longer running and no unresolved threads remain.
