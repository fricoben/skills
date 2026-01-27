# Complete Command Reference

## Core Interaction Commands

### open
Navigate to a URL.
```bash
agent-browser open <url>
agent-browser open example.com
agent-browser open https://app.example.com/login
```

### click
Click an element by ref or CSS selector.
```bash
agent-browser click <selector|@ref>
agent-browser click @e2
agent-browser click "#submit-btn"
```

### dblclick
Double-click an element.
```bash
agent-browser dblclick @e1
```

### type
Type text into an element (appends to existing content).
```bash
agent-browser type <selector|@ref> <text>
agent-browser type @e3 "hello world"
```

### fill
Clear element and fill with text.
```bash
agent-browser fill <selector|@ref> <text>
agent-browser fill @e3 "new value"
```

### press
Press a keyboard key.
```bash
agent-browser press <key>
agent-browser press Enter
agent-browser press Tab
agent-browser press Escape
agent-browser press Control+a    # Select all
agent-browser press Control+c    # Copy
agent-browser press ArrowDown
```

### hover
Hover over an element.
```bash
agent-browser hover @e1
```

### focus
Focus an element.
```bash
agent-browser focus @e3
```

### check / uncheck
Toggle checkboxes.
```bash
agent-browser check @e5
agent-browser uncheck @e5
```

### select
Select dropdown option(s).
```bash
agent-browser select <selector|@ref> <value...>
agent-browser select @e6 "option1"
agent-browser select @e6 "opt1" "opt2"  # Multiple
```

### drag
Drag and drop between elements.
```bash
agent-browser drag <source> <destination>
agent-browser drag @e1 @e5
```

### upload
Upload files to a file input.
```bash
agent-browser upload <selector|@ref> <files...>
agent-browser upload @e7 document.pdf
agent-browser upload @e7 file1.jpg file2.jpg
```

### download
Download file by clicking element.
```bash
agent-browser download <selector|@ref> <path>
agent-browser download @e3 ./downloads/file.pdf
```

### scroll
Scroll the page.
```bash
agent-browser scroll <direction> [pixels]
agent-browser scroll down
agent-browser scroll up 500
agent-browser scroll left
agent-browser scroll right 200
```

### scrollintoview
Scroll element into viewport.
```bash
agent-browser scrollintoview @e10
```

### wait
Wait for element or time.
```bash
agent-browser wait <selector|ms>
agent-browser wait @e5           # Wait for element
agent-browser wait "#loading"    # Wait for CSS selector
agent-browser wait 2000          # Wait 2 seconds
```

### screenshot
Take screenshot.
```bash
agent-browser screenshot [path]
agent-browser screenshot
agent-browser screenshot page.png
agent-browser screenshot --full       # Full page
agent-browser screenshot -f page.png  # Full page with path
```

### pdf
Save page as PDF.
```bash
agent-browser pdf <path>
agent-browser pdf page.pdf
```

### snapshot
Get accessibility tree with element refs.
```bash
agent-browser snapshot
agent-browser snapshot -i              # Interactive elements only
agent-browser snapshot -c              # Compact (remove empty)
agent-browser snapshot -d 5            # Max depth 5
agent-browser snapshot -s "#main"      # Scope to selector
agent-browser snapshot --json          # JSON output
```

### eval
Run JavaScript in page context.
```bash
agent-browser eval <js>
agent-browser eval "document.title"
agent-browser eval "window.scrollTo(0, 0)"
agent-browser eval "localStorage.getItem('token')"
```

### close
Close the browser.
```bash
agent-browser close
```

## Mouse Commands

```bash
agent-browser mouse move <x> <y>       # Move cursor
agent-browser mouse down               # Press left button
agent-browser mouse down right         # Press right button
agent-browser mouse up                 # Release button
agent-browser mouse wheel <dy> [dx]    # Scroll wheel
```

## Tab Management

```bash
agent-browser tab              # Show current tab
agent-browser tab list         # List all tabs
agent-browser tab new          # Create new tab
agent-browser tab close        # Close current tab
agent-browser tab 2            # Switch to tab 2
```

## Find Command Locators

| Locator | Description | Example |
|---------|-------------|---------|
| `role` | ARIA role | `find role button click --name Submit` |
| `text` | Text content | `find text "Sign In" click` |
| `label` | Form label | `find label "Email" fill "user@example.com"` |
| `placeholder` | Placeholder text | `find placeholder "Search" type "query"` |
| `alt` | Image alt text | `find alt "Logo" click` |
| `title` | Title attribute | `find title "Close" click` |
| `testid` | data-testid | `find testid "login-btn" click` |
| `first` | First match | `find first ".item" click` |
| `last` | Last match | `find last "button" click` |
| `nth` | Nth match (0-based) | `find nth 2 ".card" hover` |

### Find options
```bash
--name <name>    # Filter by accessible name (for role)
--exact          # Require exact text match
```

## Is (State Check) Commands

```bash
agent-browser is visible @e1     # Check visibility
agent-browser is enabled @e3     # Check if enabled
agent-browser is checked @e5     # Check checkbox state
```
