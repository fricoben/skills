---
name: agent-browser
description: >
  Headless browser automation CLI for AI agents using agent-browser. Fast Rust CLI
  with Playwright backend. Use for web scraping, form filling, testing, and automation.
  Trigger terms: agent-browser, browser automation, headless browser, web scraping,
  playwright cli, browser cli, web automation, click element, fill form, screenshot,
  accessibility snapshot, browser testing.
---

## When to Use
- Automating web interactions (clicking, typing, form filling)
- Scraping content from web pages
- Taking screenshots or PDFs of web pages
- Testing web applications via CLI
- Running browser automation in scripts or CI/CD
- When you need deterministic element selection via accessibility refs

## When NOT to Use
- Simple HTTP requests (use curl/fetch instead)
- When you need real-time browser control with visual feedback

## Installation
```bash
npm install -g agent-browser
agent-browser install  # Install browser binaries
```

## Core Workflow

### 1. Open a page and get snapshot
```bash
agent-browser open example.com
agent-browser snapshot -i  # Get interactive elements with refs (@e1, @e2, etc.)
```

### 2. Interact using refs
```bash
agent-browser click @e2           # Click element by ref
agent-browser fill @e3 "hello"    # Clear and fill input
agent-browser type @e3 "text"     # Type into element (appends)
agent-browser press Enter         # Press key
```

### 3. Verify and capture
```bash
agent-browser get text @e1        # Get text content
agent-browser screenshot          # Take screenshot
agent-browser get url             # Get current URL
```

## Essential Commands

| Command | Description |
|---------|-------------|
| `open <url>` | Navigate to URL |
| `snapshot` | Get accessibility tree with element refs |
| `snapshot -i` | Interactive elements only (recommended) |
| `click @ref` | Click element |
| `fill @ref <text>` | Clear and fill input |
| `type @ref <text>` | Type into element |
| `press <key>` | Press key (Enter, Tab, Escape, Control+a) |
| `get text @ref` | Get element text |
| `get url` | Get current URL |
| `screenshot [path]` | Take screenshot |
| `close` | Close browser |

## Finding Elements

### By semantic locators
```bash
agent-browser find role button click --name Submit
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "user@example.com"
agent-browser find placeholder "Search..." type "query"
agent-browser find testid "login-btn" click
```

### Position-based
```bash
agent-browser find first ".item" click
agent-browser find last "button" click
agent-browser find nth 2 ".card" hover
```

## Snapshot Options

```bash
agent-browser snapshot              # Full accessibility tree
agent-browser snapshot -i           # Interactive elements only
agent-browser snapshot -c           # Compact (remove empty elements)
agent-browser snapshot -d 5         # Limit depth to 5
agent-browser snapshot -s "#main"   # Scope to CSS selector
agent-browser snapshot --json       # Output as JSON
```

## Get Information

```bash
agent-browser get text @e1          # Text content
agent-browser get html "#content"   # Inner HTML
agent-browser get value @e3         # Input value
agent-browser get attr @e1 href     # Attribute value
agent-browser get title             # Page title
agent-browser get url               # Current URL
agent-browser get count ".item"     # Count matching elements
agent-browser get box @e1           # Bounding box
agent-browser get styles @e1        # Computed styles
```

## Forms and Inputs

```bash
agent-browser fill @e3 "text"       # Clear and fill
agent-browser type @e3 "text"       # Append text
agent-browser check @e5             # Check checkbox
agent-browser uncheck @e5           # Uncheck checkbox
agent-browser select @e6 "option1"  # Select dropdown option
agent-browser upload @e7 file.pdf   # Upload file
```

## Navigation

```bash
agent-browser open example.com
agent-browser back                  # Go back
agent-browser forward               # Go forward
agent-browser reload                # Reload page
```

## Browser Settings

```bash
agent-browser set viewport 1920 1080
agent-browser set device "iPhone 12"
agent-browser set geo 37.7749 -122.4194
agent-browser set offline on
agent-browser set media dark
agent-browser set headers '{"Authorization": "Bearer token"}'
agent-browser set credentials user pass
```

## Sessions and Persistence

```bash
# Isolated sessions (separate cookies/storage)
agent-browser --session test open example.com
agent-browser --session test snapshot

# Persistent profile (survives restarts)
agent-browser --profile ~/.myapp open example.com

# Load storage state from file
agent-browser --state auth.json open example.com

# List active sessions
agent-browser session list
```

## Global Options

| Option | Description |
|--------|-------------|
| `--session <name>` | Isolated session name |
| `--profile <path>` | Persistent browser profile |
| `--state <path>` | Load storage state from JSON |
| `--headed` | Show browser window (not headless) |
| `--json` | Output as JSON |
| `--cdp <port>` | Connect via Chrome DevTools Protocol |
| `--proxy <url>` | Proxy server URL |
| `--user-agent <ua>` | Custom User-Agent |
| `--ignore-https-errors` | Ignore certificate errors |

## Checks & Guardrails
- Always use `snapshot -i` first to get element refs before interacting
- Refs (@e1, @e2) are only valid until the page changes - take new snapshots after navigation
- Use `wait <selector>` or `wait <ms>` when elements load asynchronously
- Check `console` and `errors` for debugging JavaScript issues
- Close browser with `agent-browser close` when done

## References
- [Complete Command Reference](references/commands.md)
- [Network & Cookies](references/network.md)
- [Debug & Recording](references/debug.md)
