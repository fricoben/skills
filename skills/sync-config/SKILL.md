---
name: sync-config
description: >
  Sync all configuration (skills and MCP servers) to all installed agents.
  Trigger terms: sync config, sync skills, sync mcp, sync agents, sync all.
---

# Sync Config

Sync all configuration (skills and MCP servers) to all installed agents.

1. Sync skills: `npx skills add ./skills -g --all -y`
2. Sync MCP servers: `python3 bin/sync-mcp.py`

Report the results of each sync operation to the user.
