# Test Server Deployment Reference

## Server: demo.oraxen.com

A dedicated VPS running a Paper Minecraft server for plugin testing.

## Server Configuration

| Property | Value |
|----------|-------|
| **Public Address** | `demo.oraxen.com` |
| **Minecraft Version** | Paper 1.21.4 |
| **Server Directory** | `/root/minecraft/paper-1.21` |
| **Plugins Directory** | `/root/minecraft/paper-1.21/plugins/` |
| **Systemd Service** | `minecraft-test.service` |

## Credentials

All credentials are stored in `secrets.json` (from `~/minecraft/secrets.json`):

```json
{
  "servers": {
    "test_server": {
      "ssh": {
        "host": "<server-ip>",
        "user": "root",
        "port": 22
      },
      "paths": {
        "plugins_dir": "/root/minecraft/paper-1.21/plugins/"
      },
      "systemd": {
        "unit": "minecraft-test.service"
      }
    },
    "dedicated": {
      "ssh": {
        "identity_file": "~/.ssh/cursor"
      }
    }
  }
}
```

## SSH Access

```bash
# Extract credentials
HOST="$(jq -r '.servers.test_server.ssh.host' secrets.json)"
USER="$(jq -r '.servers.test_server.ssh.user' secrets.json)"
PORT="$(jq -r '.servers.test_server.ssh.port' secrets.json)"
KEY="$(jq -r '.servers.dedicated.ssh.identity_file' secrets.json)"

# Connect
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST"
```

## MCServerJars API

MCServerJars provides an API for downloading Minecraft server jars.

**Documentation:** https://mcserverjars.com/docs

### Endpoints

```
Base URL: https://mcserverjars.com/api

# Projects
GET /v1/projects                              # List all server software
GET /v1/projects/:slug                        # Get project details
GET /v1/projects/:slug/versions               # List all MC versions for project
GET /v1/projects/:slug/versions/:version      # List builds for version
GET /v1/projects/:slug/versions/:version/latest  # Get latest build

# NMS Mappings (useful for plugin development)
GET /v1/nms-mappings                          # All MC-to-NMS revision mappings
GET /v1/nms-mappings/:version                 # NMS revision for specific version

# Changelogs
GET /v1/changelogs                            # List changelogs (?project= filter)
GET /v1/changelogs/:version                   # Changelogs for specific version
GET /v1/changelogs/range?from=X&to=Y&project=Z  # Aggregate changelogs between versions
```

### Build Response Format

```json
{
  "build": 123,
  "download_url": "https://...",
  "sha256": "abc123...",
  "created_at": "2024-01-15T12:00:00Z"
}
```

### Example: Get Latest Paper 1.21.4

```bash
# Get build info
curl -s "https://mcserverjars.com/api/v1/projects/paper/versions/1.21.4/latest" | jq

# Download with checksum verification
URL=$(curl -s 'https://mcserverjars.com/api/v1/projects/paper/versions/1.21.4/latest' | jq -r '.download_url')
EXPECTED=$(curl -s 'https://mcserverjars.com/api/v1/projects/paper/versions/1.21.4/latest' | jq -r '.sha256')
curl -o server.jar "$URL"
ACTUAL=$(sha256sum server.jar | cut -d' ' -f1)
[ "$EXPECTED" = "$ACTUAL" ] && echo "Checksum OK" || echo "Checksum FAILED"
```

### Supported Server Types

| Slug | Description |
|------|-------------|
| `paper` | Paper server (high performance Spigot fork) |
| `spigot` | Spigot server |
| `bukkit` | Bukkit server |
| `vanilla` | Official Mojang server |
| `purpur` | Purpur (Paper fork with extras) |
| `folia` | Folia (multi-threaded Paper fork) |
| `fabric` | Fabric mod loader |
| `forge` | Forge mod loader |
| `neoforge` | NeoForge mod loader |
| `velocity` | Velocity proxy |
| `bungeecord` | BungeeCord proxy |
| `waterfall` | Waterfall proxy |

### Changelog Endpoints (Breaking Changes Detection)

Use these endpoints to identify breaking changes before upgrading.

**List changelogs:**
```bash
# All changelogs for a project
GET /v1/changelogs?project=paper

# Changelogs for a specific Minecraft version (all projects)
GET /v1/changelogs/:version
```

**Aggregate changelogs across version range (LLM-optimized):**
```bash
# Get all changes between two versions
GET /v1/changelogs/range?from=1.20.4&to=1.21.4&project=paper
```

**Example: Check what changed between versions before upgrade:**
```bash
# See all Paper changes from 1.20.4 to 1.21.4
curl -s "https://mcserverjars.com/api/v1/changelogs/range?from=1.20.4&to=1.21.4&project=paper" | jq

# See vanilla Minecraft changes
curl -s "https://mcserverjars.com/api/v1/changelogs/range?from=1.20.4&to=1.21.4&project=vanilla" | jq
```

**Response format:**
```json
{
  "from": "1.20.4",
  "to": "1.21.4",
  "project": "paper",
  "versions": [
    {
      "version": "1.21.0",
      "breaking_changes": ["..."],
      "api_modifications": ["..."],
      "summary": "..."
    }
  ]
}
```

**Use cases:**
- Migration planning before server upgrades
- Identifying plugin compatibility issues
- Understanding NMS/API changes for plugin development
- LLM-based bulk analysis of changes

### Download Script

```bash
#!/bin/bash
# download-server.sh - Download latest server jar with checksum verification

SERVER_TYPE="${1:-paper}"
VERSION="${2:-1.21.4}"
OUTPUT="${3:-server.jar}"

API="https://mcserverjars.com/api/v1/projects"

# Get build info
BUILD_INFO=$(curl -s "$API/$SERVER_TYPE/versions/$VERSION/latest")
DOWNLOAD_URL=$(echo "$BUILD_INFO" | jq -r '.download_url')
EXPECTED_SHA=$(echo "$BUILD_INFO" | jq -r '.sha256')

if [ "$DOWNLOAD_URL" == "null" ]; then
    echo "Error: Could not find $SERVER_TYPE $VERSION"
    exit 1
fi

# Download
curl -o "$OUTPUT" "$DOWNLOAD_URL"

# Verify checksum
ACTUAL_SHA=$(sha256sum "$OUTPUT" | cut -d' ' -f1)
if [ "$EXPECTED_SHA" = "$ACTUAL_SHA" ]; then
    echo "Downloaded $SERVER_TYPE $VERSION to $OUTPUT (checksum OK)"
else
    echo "ERROR: Checksum mismatch!"
    echo "Expected: $EXPECTED_SHA"
    echo "Actual:   $ACTUAL_SHA"
    exit 1
fi
```

## Plugin Deployment

### Upload Single Plugin

```bash
JAR="path/to/plugin.jar"
rsync -avP -e "ssh -i ${KEY/#\~/$HOME} -p ${PORT}" "$JAR" "${USER}@${HOST}:${PLUGINS_DIR}/"
```

### Upload Multiple Plugins

```bash
rsync -avP -e "ssh -i ${KEY/#\~/$HOME} -p ${PORT}" ./plugins/*.jar "${USER}@${HOST}:${PLUGINS_DIR}/"
```

### Remove Old Versions

```bash
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "rm ${PLUGINS_DIR}/MyPlugin-*.jar"
```

## Systemd Service Management

```bash
# Status
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "systemctl status minecraft-test.service"

# Start
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "systemctl start minecraft-test.service"

# Stop
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "systemctl stop minecraft-test.service"

# Restart
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "systemctl restart minecraft-test.service"

# View logs (live)
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "journalctl -u minecraft-test.service -f"

# View recent logs
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "journalctl -u minecraft-test.service -n 100"
```

## Full Deployment Workflow

```bash
# 1. Build plugin
./gradlew build -x test

# 2. Load credentials
HOST="$(jq -r '.servers.test_server.ssh.host' secrets.json)"
USER="$(jq -r '.servers.test_server.ssh.user' secrets.json)"
PORT="$(jq -r '.servers.test_server.ssh.port' secrets.json)"
KEY="$(jq -r '.servers.dedicated.ssh.identity_file' secrets.json)"
PLUGINS_DIR="$(jq -r '.servers.test_server.paths.plugins_dir' secrets.json)"
UNIT="$(jq -r '.servers.test_server.systemd.unit' secrets.json)"

# 3. Upload plugin
JAR="build/libs/oraxen-*.jar"
rsync -avP -e "ssh -i ${KEY/#\~/$HOME} -p ${PORT}" $JAR "${USER}@${HOST}:${PLUGINS_DIR}/"

# 4. Restart server
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "systemctl restart $UNIT"

# 5. Watch logs for startup
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST" "journalctl -u $UNIT -f"
```

## Server Version Upgrade

```bash
# SSH into server
ssh -i "${KEY/#\~/$HOME}" -p "$PORT" "$USER@$HOST"

# Navigate to server directory
cd /root/minecraft/paper-1.21

# Stop server
systemctl stop minecraft-test.service

# Backup current jar
mv server.jar server.jar.backup

# Download new version
curl -o server.jar "$(curl -s 'https://mcserverjars.com/v1/projects/paper/versions/1.21.4/latest' | jq -r '.download')"

# Start server
systemctl start minecraft-test.service

# Monitor startup
journalctl -u minecraft-test.service -f
```
