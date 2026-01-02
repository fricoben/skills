# MCPanel CLI and mcwrap Reference

## Overview

MCPanel provides tools for managing remote Minecraft servers:
- **MCPanel** - Native macOS app with GUI
- **mcpanel-cli** - Command-line interface for server management
- **mcwrap** - Lightweight console wrapper for session persistence

## MCPanel CLI

Location: `/Users/thomas/conductor/workspaces/mcpanel/london-v1/mcpanel-cli`

Reads server config from: `~/Library/Application Support/MCPanel/servers.json`

### Commands

```bash
mcpanel-cli <command> [server-name] [args...]
```

| Command | Description |
|---------|-------------|
| `status [server]` | Show server status |
| `start [server]` | Start the server |
| `stop [server]` | Stop the server |
| `restart [server]` | Restart the server |
| `logs [server] [lines]` | Show last N log lines (default: 50) |
| `logs-follow [server]` | Follow server log in real-time |
| `plugins [server]` | List all plugins |
| `plugin-enable [server] NAME` | Enable a disabled plugin |
| `plugin-disable [server] NAME` | Disable an enabled plugin |
| `files [server] [path]` | List files in directory |
| `exec [server] <command>` | Execute remote shell command |
| `list` | List all configured servers |
| `help` | Show help |

If server name is omitted, the first configured server is used.

### Examples

```bash
# Check status
mcpanel-cli status

# Restart specific server
mcpanel-cli restart "Test Server"

# Disable a plugin
mcpanel-cli plugin-disable SkinMotion

# Follow logs
mcpanel-cli logs-follow

# Execute remote shell command
mcpanel-cli exec "ls -la /root/minecraft/paper-1.21/plugins"
```

### Server Configuration

MCPanel stores server configs in JSON format:

```json
[
  {
    "name": "Test Server",
    "host": "example.com",
    "sshPort": 22,
    "sshUsername": "root",
    "identityFilePath": "~/.ssh/cursor",
    "serverPath": "/root/minecraft/paper-1.21",
    "pluginsPath": "/root/minecraft/paper-1.21/plugins",
    "systemdUnit": "minecraft-test.service",
    "serverType": "paper"
  }
]
```

## mcwrap

Location: `/Users/thomas/conductor/workspaces/mcpanel/london-v1/wrappers/mcwrap`

A lightweight bash wrapper providing:
- Session persistence (server survives SSH disconnects)
- Reattachment via tail + input pipe
- Scrollback history in log file
- Full truecolor support (24-bit RGB preserved)

### Commands

```bash
mcwrap <command> <server-dir> [args...]
```

| Command | Description |
|---------|-------------|
| `start <dir> [java-args]` | Start server in background |
| `attach <dir> [--raw]` | Attach to console (interactive) |
| `stream <dir> [N]` | Output N history lines + follow |
| `tail <dir>` | Follow log (read-only) |
| `send <dir> <cmd>` | Send single command to console |
| `status <dir>` | Check if server is running |
| `stop <dir>` | Stop server gracefully |
| `log <dir> [N]` | Show last N lines of console |
| `list` | List all managed servers |

### Sending Minecraft Commands

```bash
# Send a command (commands go directly to server console)
mcwrap send /root/minecraft/paper-1.21 "say Hello world!"
mcwrap send /root/minecraft/paper-1.21 "give Player diamond 64"
mcwrap send /root/minecraft/paper-1.21 "tp Player 100 64 100"
mcwrap send /root/minecraft/paper-1.21 "time set day"
mcwrap send /root/minecraft/paper-1.21 "weather clear"

# Stop server gracefully (sends 'stop' command)
mcwrap stop /root/minecraft/paper-1.21
```

### Interactive Console

```bash
# Attach to console (Ctrl+C to detach)
mcwrap attach /root/minecraft/paper-1.21

# Shows recent history, then lets you type commands
# Type commands without leading /
```

### Console Output

```bash
# View last 50 lines
mcwrap log /root/minecraft/paper-1.21 50

# Follow live output (read-only)
mcwrap tail /root/minecraft/paper-1.21

# Stream history + live (for automation)
mcwrap stream /root/minecraft/paper-1.21 500
```

### Architecture

```
┌─────────────────────────────────────────────┐
│  mcwrap daemon (persistent)                 │
│                                             │
│  stdin ← named pipe ← mcwrap send           │
│            ↓                                │
│  java -jar server.jar --nogui               │
│            ↓                                │
│  stdout → console.log (with ANSI colors)    │
│              → mcwrap attach (live view)    │
└─────────────────────────────────────────────┘
```

### File Locations

State is stored in `~/.mcwrap/<id>/` where `<id>` is MD5 hash of server directory:

| File | Purpose |
|------|---------|
| `pid` | Process ID of wrapper |
| `console.log` | Console output with ANSI colors |
| `input` | Named pipe for commands |

### Starting a Server

```bash
# Start with default Java args (-Xms2G -Xmx4G)
mcwrap start /root/minecraft/paper-1.21

# Start with custom Java args
mcwrap start /root/minecraft/paper-1.21 -Xms4G -Xmx8G -jar server.jar --nogui
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCWRAP_DIR` | `~/.mcwrap` | State directory |
| `MCWRAP_LOG_LINES` | `50000` | Max log lines to keep |

## Remote Usage via SSH

```bash
# Set up credentials
HOST="$(jq -r '.servers.test_server.ssh.host' secrets.json)"
USER="$(jq -r '.servers.test_server.ssh.user' secrets.json)"
PORT="$(jq -r '.servers.test_server.ssh.port' secrets.json)"
KEY="$(jq -r '.servers.dedicated.ssh.identity_file' secrets.json)"

# Send Minecraft command
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" \
    "mcwrap send /root/minecraft/paper-1.21 'say Hello!'"

# Check status
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" \
    "mcwrap status /root/minecraft/paper-1.21"

# View logs
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" \
    "mcwrap log /root/minecraft/paper-1.21 100"
```

## MCPanel Bridge Plugin

Optional server-side plugin for enhanced communication:
- Tab completion
- Command tree (Brigadier)
- Player list with rich data
- Plugin list with metadata
- Server status (version, TPS, memory)

Uses OSC escape sequences for invisible communication through console.

Location: `/Users/thomas/conductor/workspaces/mcpanel/london-v1/mcpanel-bridge/`
