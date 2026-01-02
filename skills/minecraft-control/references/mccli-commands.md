# MC-CLI Reference

MC-CLI (mccli) is a command-line interface for controlling a running Minecraft client. It requires the mccli mod to be installed in the game.

Path: `/Users/thomas/Library/Python/3.9/bin/mccli`

## Global Options

```bash
mccli [--host HOST] [--port PORT] [--instance INSTANCE] [--json] <command>

--host HOST       MC-CLI host (default: auto-detect or localhost)
--port PORT       MC-CLI port (default: auto-detect or 25580)
-i, --instance    Connect to named instance (name or port)
--json            Output as JSON
```

## Commands

### instances
List registered MC-CLI instances.
```bash
mccli instances           # Active instances only
mccli instances --all     # Include dead instances
```

### status
Check game status (player position, dimension, health, etc.).
```bash
mccli status
mccli status --json
```

### teleport
Teleport the player to coordinates.
```bash
mccli teleport <x> <y> <z>
mccli teleport 100 64 -200
```

### time
Get or set world time.
```bash
mccli time get
mccli time set <value>    # 0=dawn, 6000=noon, 12000=dusk, 18000=midnight
```

### execute
Run any Minecraft command (without the leading `/`).
```bash
mccli execute "gamemode creative"
mccli execute "give @s diamond 64"
mccli execute "weather clear"
```

### capture
Take a screenshot.
```bash
mccli capture -o <path>             # Basic screenshot
mccli capture -o shot.png --clean   # Hide HUD first
mccli capture -o shot.png --delay 500        # Wait 500ms before capture
mccli capture -o shot.png --settle 200       # Settle time after cleanup
```

### analyze
Analyze a screenshot image.
```bash
mccli analyze <path>
mccli analyze screenshot.png
```

### compare
Compare two screenshots.
```bash
mccli compare <image_a> <image_b>
mccli compare before.png after.png
```

### shader
Shader pack management.
```bash
mccli shader list                    # List available shaders
mccli shader get                     # Get current shader
mccli shader set --name "ShaderName" # Activate shader
mccli shader reload                  # Reload shaders (hot reload)
mccli shader errors                  # Show shader compilation errors
mccli shader disable                 # Disable shaders
```

### block
Probe block information.
```bash
mccli block                          # Targeted block (raycast)
mccli block --x 100 --y 64 --z 200   # Specific coordinates
mccli block --max-distance 10        # Max raycast distance
mccli block --include-nbt            # Include block entity NBT data
```

### entity
Probe entity information.
```bash
mccli entity                         # Targeted entity
mccli entity --max-distance 20       # Max target distance
mccli entity --include-nbt           # Include entity NBT data
```

### item
Inspect held item or inventory slot.
```bash
mccli item
```

### inventory
List inventory contents.
```bash
mccli inventory                              # Full inventory
mccli inventory --section hotbar             # Just hotbar
mccli inventory --section main               # Main inventory
mccli inventory --section armor              # Armor slots
mccli inventory --section offhand            # Offhand
mccli inventory --include-empty              # Show empty slots
mccli inventory --include-nbt                # Include item NBT
```

### interact
Player interactions.
```bash
# Use item in hand
mccli interact use
mccli interact use --hand off         # Use offhand

# Attack
mccli interact attack                 # Swing at air
mccli interact attack --target block  # Attack targeted block

# Use on block (place, interact)
mccli interact use_on_block --x 10 --y 64 --z 20
mccli interact use_on_block --x 10 --y 64 --z 20 --face up
mccli interact use_on_block --x 10 --y 64 --z 20 --inside-block

# Drop items
mccli interact drop --slot 0          # Drop one item from slot
mccli interact drop --slot 0 --all    # Drop entire stack

# Hotbar selection
mccli interact select 0               # Select hotbar slot (0-8)

# Swap slots
mccli interact swap --from-slot 0 --to-slot 9
```

### chat
Chat messaging.
```bash
mccli chat send -m "Hello!"           # Send chat message
mccli chat history                    # Get chat history
mccli chat history --limit 50         # Limit messages
mccli chat history --type chat        # Only player chat
mccli chat history --type system      # Only system messages
mccli chat history --filter "error"   # Filter by regex
mccli chat clear                      # Clear chat history
```

### window
Window management for headless operation.
```bash
mccli window status                   # Get window state
mccli window focus                    # Focus Minecraft window
mccli window focus_grab --enabled true        # Grab mouse focus
mccli window focus_grab --enabled false       # Release mouse
mccli window pause_on_lost_focus --enabled false  # Don't pause when unfocused
mccli window close_screen             # Close current GUI screen
```

### server
Server connection management.
```bash
mccli server status                   # Connection status
mccli server connect "mc.example.com" # Connect to server
mccli server connect "mc.example.com" --server-port 25566
mccli server connect "mc.example.com" --resourcepack accept
mccli server connect "mc.example.com" --resourcepack reject
mccli server disconnect               # Disconnect from server
mccli server connection_error         # Get last connection error
mccli server connection_error --clear # Get and clear error
```

### resourcepack
Resource pack management.
```bash
mccli resourcepack list               # List available packs
mccli resourcepack enabled            # List enabled packs
mccli resourcepack enable --name "PackName"
mccli resourcepack disable --name "PackName"
mccli resourcepack reload             # Reload packs
```

### perf
Get performance metrics (FPS, memory, chunks).
```bash
mccli perf
mccli perf --json
```

### logs
Get game logs.
```bash
mccli logs                            # Recent logs
mccli logs --limit 100                # Limit entries
mccli logs --level error              # Only errors
mccli logs --level warn               # Warnings and above
mccli logs --filter "Exception"       # Filter by regex
mccli logs --clear                    # Clear logs after returning
mccli logs --since 12345              # Only entries with id > since

# Streaming logs
mccli logs --follow                   # Stream continuously
mccli logs --follow --interval 500    # Poll every 500ms
mccli logs --follow --until "Ready"   # Stop when pattern matches
mccli logs --follow --timeout 30000   # Stop after 30 seconds
```

### macro
Run batch operations from a JSON macro file.
```bash
mccli macro macro.json                # Run macro from file
echo '{"commands": [...]}' | mccli macro -  # From stdin
```

## Multi-Instance Support

When multiple Minecraft instances are running with mccli:

```bash
# List all instances
mccli instances

# Target specific instance by name
mccli -i "instance_name" status

# Target by port
mccli --port 25581 status
```

## JSON Output

All commands support `--json` for structured output:

```bash
mccli status --json
mccli inventory --json
mccli shader list --json
mccli perf --json
```

## Exit Codes

- 0: Success
- Non-zero: Error (check stderr for details)
