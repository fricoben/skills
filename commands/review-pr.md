---
description: Review current PR/branch changes for issues
---

Review all changes on the current branch (compared to the base branch) and provide a thorough code review:

1. **Potential Bugs**: Look for logic errors, edge cases, null/undefined issues
2. **Security Concerns**: Check for injection vulnerabilities, exposed secrets, auth issues
3. **Error Handling**: Identify missing try/catch, unhandled promises, error propagation
4. **Performance**: Flag N+1 queries, unnecessary re-renders, missing memoization
5. **Code Quality**: Suggest improvements for readability, maintainability, and consistency

For each issue found, provide:
- File and line number
- Severity (critical/warning/suggestion)
- Description of the issue
- Suggested fix
