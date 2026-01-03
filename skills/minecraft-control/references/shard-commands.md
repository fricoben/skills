# Shard CLI Reference

Shard is a minimal Minecraft launcher. Path: `/Users/thomas/.cargo/bin/shard`

## Commands Overview

```
shard <COMMAND>

Commands:
  list          List profiles
  profile       Profile management
  mod           Mod management
  resourcepack  Resourcepack management
  shaderpack    Shaderpack management
  account       Account management
  template      Template management
  store         Content store (Modrinth/CurseForge)
  logs          Log viewing
  library       Content library management
  modpack       Modpack management
  config        Configuration
  launch        Prepare and launch a profile
  help          Print this message or the help of the given subcommand(s)
```

## Profile Management

```bash
# List all profiles
shard list

# Show profile manifest
shard profile show "Profile Name"

# Create new profile
shard profile create "New Profile"

# Clone profile
shard profile clone "Source" "Destination"

# Rename profile
shard profile rename "Old Name" "New Name"

# Delete profile
shard profile delete "Profile Name"

# Diff two profiles (compare mods)
shard profile diff "Profile A" "Profile B"
```

## Launching

```bash
# Launch a profile
shard launch "Profile Name"

# Launch with specific account
shard launch "Profile Name" --account "AccountName"

# Prepare only (download assets, don't launch)
shard launch "Profile Name" --prepare-only
```

## Mod Management

```bash
shard mod <subcommand>
```

## Shader Pack Management

```bash
shard shaderpack <subcommand>
```

## Resource Pack Management

```bash
shard resourcepack <subcommand>
```

## Account Management

```bash
shard account <subcommand>
```

## Content Store (Modrinth/CurseForge)

```bash
shard store <subcommand>
```

## Profile Manifest Structure

When you run `shard profile show`, you get a JSON manifest:

```json
{
  "id": "Profile Name",
  "mcVersion": "1.21.11",
  "loader": {
    "type": "fabric",       // or "neoforge"
    "version": "0.18.4"     // loader version
  },
  "mods": [
    {
      "name": "mod-name",
      "hash": "sha256:...",
      "version": "1.0.0",
      "source": "https://...",
      "file_name": "mod.jar",
      "platform": "modrinth",
      "project_id": "...",
      "version_id": "..."
    }
  ],
  "resourcepacks": [],
  "shaderpacks": [
    {
      "name": "ShaderName",
      "hash": "sha256:...",
      "version": "1.0",
      "source": "https://...",
      "file_name": "shader.zip",
      "platform": "modrinth",
      "project_id": "...",
      "version_id": "..."
    }
  ],
  "runtime": {
    "args": []
  },
  "files": {
    "config_overrides": "overrides"
  }
}
```

## Pre-configured Profiles

### Fabric 1.21.11
- Minecraft: 1.21.11
- Loader: Fabric 0.18.4
- Mods: Fabric API, mccli mod
- Shaders: ComplementaryReimagined r5.6.1

### NeoForge 1.21.11
- Minecraft: 1.21.11
- Loader: NeoForge 21.11.19-beta
- Mods: mccli-neoforge mod

Both profiles are ready for LLM-assisted development with mccli pre-installed.

## Supported Mod Loaders

| Loader | Type | Notes |
|--------|------|-------|
| Fabric | `fabric` | Lightweight, fast updates |
| NeoForge | `neoforge` | Fork of Forge, modern API |

When creating profiles, specify the loader type:
```bash
shard profile create "My Profile" --mc 1.21.4 --loader fabric
shard profile create "My Profile" --mc 1.21.4 --loader neoforge
```
