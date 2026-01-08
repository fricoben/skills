---
name: e2e-testing
description: >
  End-to-end testing skill for web applications using Playwright MCP.
  Trigger terms: e2e, end-to-end, playwright, test, testing, UI testing,
  functional testing, integration testing, responsive, mobile testing.
---

## When to Use
- Testing web application features through the UI
- Verifying user flows work correctly (login, forms, navigation)
- Checking responsive design across mobile, tablet, and desktop
- Testing a specific feature before deployment
- Full regression testing of an application

## When NOT to Use
- Unit testing individual functions
- API-only testing (no UI)
- Non-web applications (mobile apps, CLI tools)
- Performance/load testing

## Inputs the Agent Should Ask For (only if missing)
- **App URL**: The URL of the web application to test
- **Specific feature** (optional): If testing a particular feature, describe it
- **Credentials** (if needed): Login credentials for authenticated areas

## Outputs / Definition of Done
- Test summary with pass/fail counts
- Screenshots of any failures
- Responsive verification at mobile, tablet, and desktop
- Console error report (if any JavaScript errors found)
- Recommendations for fixing issues

## Procedure

### 1. Gather Context
If app URL not provided, ask for it. Determine if testing:
- A specific feature (user-specified)
- The entire application (default)

### 2. Initial Exploration
```
1. Navigate to the app URL using browser_navigate
2. Take a snapshot using browser_snapshot to understand page structure
3. Check browser_console_messages for any initial errors
4. Identify all interactive elements: links, buttons, forms, inputs
```

### 3. Create Test Plan
**If specific feature requested:**
- Focus all tests on that feature only
- Identify the elements and flows related to that feature

**If full app testing:**
- List all visible routes/pages from navigation
- Identify all forms and their required fields
- List all interactive elements (buttons, dropdowns, modals)
- Prioritize critical user flows (auth, main features, checkout if e-commerce)

### 4. Execute Tests
For each test case:
```
1. Announce: "Testing: [description of what we're testing]"
2. Perform action using Playwright MCP tools:
   - browser_click for clicking elements
   - browser_type or browser_fill_form for input
   - browser_navigate for page transitions
3. Wait if needed using browser_wait_for
4. Take snapshot to verify expected state
5. If failure: take screenshot with browser_take_screenshot
6. Log result: PASS or FAIL with details
```

**Test Categories** (see references/test-categories.md):
- Navigation and routing
- Form submission and validation
- Interactive elements (modals, dropdowns, toggles)
- Data display and rendering
- Error states and edge cases

### 5. Responsive Testing
For each breakpoint (see references/responsive-breakpoints.md):

```
1. Resize browser using browser_resize:
   - Mobile: 375x667
   - Tablet: 768x1024
   - Desktop: 1280x800

2. Navigate to key pages
3. Take snapshot to verify:
   - Layout doesn't break
   - Navigation is accessible
   - No horizontal scroll
   - Text is readable
4. Check console for errors at each size
```

### 6. Report Results
Generate a summary:
```
## Test Results

### Summary
- Total tests: X
- Passed: Y
- Failed: Z

### Failed Tests
[For each failure, include:]
- Test name
- Expected behavior
- Actual behavior
- Screenshot (if taken)

### Responsive Issues
[List any layout/functionality issues per breakpoint]

### Console Errors
[List any JavaScript errors found]

### Recommendations
[Actionable fixes for issues found]
```

### 7. Cleanup (CRITICAL)
**You MUST kill any localhost server you started for testing:**
```
1. Close the browser using browser_close
2. Find and kill any localhost processes you started:
   - Use: lsof -ti:PORT | xargs kill -9
   - Or: pkill -f "npm run dev" (or whatever command was used)
3. Verify the port is free: lsof -i:PORT (should return nothing)
```

⚠️ **NEVER leave localhost servers running after testing.** This prevents port conflicts for subsequent tests and avoids resource leaks.

## Checks & Guardrails
- Always take a snapshot before performing actions to understand current state
- Use browser_snapshot (accessibility tree) for interaction, browser_take_screenshot for visual evidence
- Wait for elements/text before interacting (browser_wait_for)
- Check console messages after each major action
- Don't assume element refs persist across navigations - take new snapshots

## References
- [Playwright MCP Commands](references/playwright-mcp-commands.md)
- [Test Categories](references/test-categories.md)
- [Responsive Breakpoints](references/responsive-breakpoints.md)
