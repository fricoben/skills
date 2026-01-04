---
description: Review and resolve Bugbot/review threads on the current PR
---

Continuously monitor and resolve all unresolved review threads on the current PR. This is a long-running task that loops for hours until Bugbot stops finding issues.

## Setup (do once)

1. Authenticate with `gh auth status`.

2. Find and checkout the PR:
   ```
   gh pr list --state open
   gh pr checkout <pr>
   ```

## Main Loop

**IMPORTANT: Run this loop continuously. Do not exit after one iteration. Keep looping for hours until the exit condition is met.**

```
while true:
    1. Fetch all review threads via GraphQL
    2. Fix or respond to each unresolved thread
    3. Resolve threads via GraphQL mutation
    4. Commit and push any changes
    5. Sleep 5 minutes
    6. Re-fetch threads, check Bugbot status, exit if done
```

### Step 1: Fetch review threads

```
gh api graphql -F owner=<owner> -F name=<repo> -F number=<pr> -f query='
  query($owner:String!, $name:String!, $number:Int!){
    repository(owner:$owner,name:$name){
      pullRequest(number:$number){
        reviewThreads(first:100){
          nodes{id isResolved isOutdated comments(first:50){nodes{id author{login} body}}}
          pageInfo{hasNextPage endCursor}
        }
      }
    }
  }'
```

Paginate if `hasNextPage` is true. Focus on threads where `isResolved=false`.

### Step 2: Fix or respond

For each unresolved thread:
- Read the code and verify the issue
- If valid: fix it
- If not applicable: reply explaining why

### Step 3: Resolve threads

```
gh api graphql -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{isResolved}}}' -F threadId=<threadId>
```

### Step 4: Commit and push

If `git status --porcelain` shows changes, commit and push.

### Step 5: Sleep

Wait 5 minutes before the next iteration. Use `sleep 300`.

### Step 6: Exit condition

1. Re-fetch review threads (same as Step 1) to get fresh data
2. Check if Bugbot is running: `gh pr checks <pr>` or `gh run list --workflow bugbot`

**Exit ONLY when BOTH conditions are true:**
- Bugbot is not running
- No unresolved threads remain (based on freshly fetched data)

Otherwise, continue looping.

## Guardrails

- Verify each issue against the codebase before fixing
- Keep fixes minimal and focused
- Always resolve threads via GraphQL, not just by replying
- Do not ask for confirmation between iterations
