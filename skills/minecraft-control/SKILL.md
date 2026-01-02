---
name: minecraft-control
description: >
  Control Minecraft launcher and client via shard (CLI launcher) and mccli (in-game control).
  Also covers test server deployment at demo.oraxen.com.
  Trigger terms: minecraft, shard, mccli, mc-cli, launcher, shader, teleport, screenshot, game control, oraxen, demo server, test server, deploy plugin.
---

## When to Use
- Launch Minecraft with specific profiles, mods, or shader packs via `shard`.
- Control a running Minecraft client: teleport, capture screenshots, execute commands, manage shaders.
- Deploy plugins to the test server at `demo.oraxen.com`.

## When NOT to Use
- If Minecraft is not installed or `shard`/`mccli` are unavailable.

## Prerequisites
- `shard` CLI: `/Users/thomas/.cargo/bin/shard`
- `mccli` CLI: `/Users/thomas/Library/Python/3.9/bin/mccli`
- The **"Vanilla Debugging"** profile in shard has the `mccli` mod pre-installed.

## Quick Start

### Launch Minecraft
```bash
shard list                                    # List profiles
shard launch "Vanilla Debugging"              # Launch (has mccli mod)
```

### Control Running Client
```bash
mccli status                                  # Check connection
mccli instances                               # List running instances
mccli teleport 100 64 100                     # Teleport player
mccli capture -o shot.png --clean             # Screenshot (hide HUD)
mccli shader reload                           # Reload shaders
mccli execute "time set day"                  # Run command
```

## Key Commands Summary

### Shard Launcher
| Command | Description |
|---------|-------------|
| `shard list` | List all profiles |
| `shard launch <profile>` | Launch a profile |
| `shard profile show <name>` | Show profile manifest |

### MC-CLI (In-Game Control)
| Command | Description |
|---------|-------------|
| `mccli status` | Game status |
| `mccli teleport <x> <y> <z>` | Teleport player |
| `mccli capture -o <file> --clean` | Screenshot |
| `mccli shader list/set/reload` | Shader management |
| `mccli execute "<cmd>"` | Run Minecraft command |
| `mccli block` / `mccli entity` | Inspect targeted block/entity |

See `references/mccli-commands.md` for full command reference.

## Multi-Agent Instance Management

**CRITICAL: Multiple agents must NOT share the same Minecraft instance.**

```bash
# Always check instances first
mccli instances

# Target YOUR instance explicitly
mccli -i "my_instance" teleport 100 64 100
mccli --port 25580 status
```

**Rule: One agent = One instance. Always verify with `mccli instances` before starting work.**

---

## Test Server (demo.oraxen.com)

| Property | Value |
|----------|-------|
| **Address** | `demo.oraxen.com` |
| **Version** | Paper 1.21.4 |
| **Server Path** | `/root/minecraft/paper-1.21` |

### Quick Deploy
```bash
# Upload plugin and restart
rsync -avP -e "ssh -i ~/.ssh/cursor" build/libs/*.jar root@demo.oraxen.com:/root/minecraft/paper-1.21/plugins/
ssh -i ~/.ssh/cursor root@demo.oraxen.com "systemctl restart minecraft-test.service"
```

### Send Minecraft Commands (via mcwrap)
```bash
# From local machine
ssh -i ~/.ssh/cursor root@demo.oraxen.com "mcwrap send /root/minecraft/paper-1.21 'say Hello!'"
```

### MCServerJars API (Server Updates)
```bash
# Get latest Paper build
curl -s "https://mcserverjars.com/api/v1/projects/paper/versions/1.21.4/latest" | jq

# Check breaking changes before upgrade
curl -s "https://mcserverjars.com/api/v1/changelogs/range?from=1.20.4&to=1.21.4&project=paper" | jq
```

See `references/test-server-deployment.md` for full deployment procedures.

## References
- `references/shard-commands.md` - Full shard CLI reference
- `references/mccli-commands.md` - Full mccli CLI reference
- `references/test-server-deployment.md` - Server deployment, MCServerJars API
- `references/mcpanel-mcwrap.md` - MCPanel CLI and mcwrap wrapper
