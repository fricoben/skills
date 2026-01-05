# Playwright MCP Commands Reference

## Navigation

### browser_navigate
Navigate to a URL.
```
Parameters:
- url (required): The URL to navigate to
```

### browser_navigate_back
Go back to the previous page.

## Page Analysis

### browser_snapshot
Capture accessibility snapshot of the current page. **Preferred over screenshot for understanding page structure and finding element refs for interactions.**
```
Parameters:
- filename (optional): Save snapshot to markdown file
```

### browser_take_screenshot
Take a visual screenshot. Use for documenting failures or visual verification.
```
Parameters:
- filename (optional): File name to save screenshot
- fullPage (optional): Capture full scrollable page
- element/ref (optional): Screenshot specific element
- type (optional): "png" or "jpeg"
```

## Interactions

### browser_click
Click on an element.
```
Parameters:
- element (required): Human-readable description
- ref (required): Exact element reference from snapshot
- button (optional): "left", "right", "middle"
- doubleClick (optional): Perform double click
```

### browser_type
Type text into an editable element.
```
Parameters:
- element (required): Human-readable description
- ref (required): Element reference from snapshot
- text (required): Text to type
- submit (optional): Press Enter after typing
- slowly (optional): Type character by character
```

### browser_fill_form
Fill multiple form fields at once.
```
Parameters:
- fields (required): Array of field objects:
  - name: Human-readable field name
  - ref: Element reference from snapshot
  - type: "textbox", "checkbox", "radio", "combobox", "slider"
  - value: Value to fill (use "true"/"false" for checkbox)
```

### browser_select_option
Select an option in a dropdown.
```
Parameters:
- element (required): Description
- ref (required): Element reference
- values (required): Array of values to select
```

### browser_press_key
Press a keyboard key.
```
Parameters:
- key (required): Key name (e.g., "Enter", "Tab", "ArrowDown")
```

### browser_hover
Hover over an element.
```
Parameters:
- element (required): Description
- ref (required): Element reference
```

## Viewport & Layout

### browser_resize
Resize the browser window. Essential for responsive testing.
```
Parameters:
- width (required): Width in pixels
- height (required): Height in pixels
```

## Waiting

### browser_wait_for
Wait for text to appear/disappear or a specified time.
```
Parameters:
- text (optional): Text to wait for to appear
- textGone (optional): Text to wait for to disappear
- time (optional): Time to wait in seconds
```

## Debugging

### browser_console_messages
Returns all console messages. Use to check for JavaScript errors.
```
Parameters:
- level (optional): "error", "warning", "info", "debug" (each includes more severe levels)
```

### browser_network_requests
Returns all network requests since page load.
```
Parameters:
- includeStatic (optional): Include images, fonts, scripts (default: false)
```

## Advanced

### browser_evaluate
Execute JavaScript on the page.
```
Parameters:
- function (required): JavaScript function to execute
- element/ref (optional): Element context
```

### browser_handle_dialog
Handle alert/confirm/prompt dialogs.
```
Parameters:
- accept (required): Whether to accept the dialog
- promptText (optional): Text for prompt dialogs
```

### browser_file_upload
Upload files.
```
Parameters:
- paths (required): Array of absolute file paths
```

### browser_tabs
Manage browser tabs.
```
Parameters:
- action (required): "list", "new", "close", "select"
- index (optional): Tab index for close/select
```

### browser_close
Close the browser page.

## Best Practices

1. **Always snapshot before interacting** - Get fresh element refs
2. **Use browser_snapshot over screenshot** - Provides actionable element refs
3. **Wait for dynamic content** - Use browser_wait_for before assertions
4. **Check console after actions** - Catch JavaScript errors early
5. **Element refs are ephemeral** - Don't reuse refs across navigations
