Sync all configuration (skills, commands, and MCP servers) to all installed agents.

1. Sync skills: `npx skills add ./skills -g --all -y`
2. Sync commands: `python3 bin/sync-commands.py`
3. Sync MCP servers: `python3 bin/sync-mcp.py`

Report the results of each sync operation to the user.
