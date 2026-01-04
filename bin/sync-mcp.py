#!/usr/bin/env python3
"""
Sync MCP server configurations to Claude Code and Codex.

This script reads the canonical MCP configuration from mcp/servers.json
and syncs it to:
  - Claude Code: ~/.claude.json (mcpServers key)
  - Codex: ~/.codex/config.toml (mcp_servers sections)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from pathlib import Path
from typing import Any


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync MCP servers to Claude Code and Codex")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without modifying files")
    target_group = parser.add_mutually_exclusive_group()
    target_group.add_argument("--claude-only", action="store_true", help="Only sync to Claude Code")
    target_group.add_argument("--codex-only", action="store_true", help="Only sync to Codex")
    return parser.parse_args()


def load_mcp_config() -> dict[str, Any]:
    """Load the canonical MCP configuration from mcp/servers.json."""
    config_path = repo_root() / "mcp" / "servers.json"
    if not config_path.exists():
        raise FileNotFoundError(f"MCP config not found: {config_path}")
    return json.loads(config_path.read_text(encoding="utf-8"))


def sync_to_claude(servers: dict[str, Any], dry_run: bool) -> None:
    """Sync MCP servers to Claude Code's ~/.claude.json."""
    claude_json_path = Path.home() / ".claude.json"

    if claude_json_path.exists():
        config = json.loads(claude_json_path.read_text(encoding="utf-8"))
    else:
        config = {}

    # Update the mcpServers key
    config["mcpServers"] = servers

    if dry_run:
        print(f"DRY-RUN: Would update {claude_json_path}")
        print(f"  mcpServers: {list(servers.keys())}")
    else:
        # Create backup
        if claude_json_path.exists():
            backup_path = claude_json_path.with_suffix(".json.bak")
            shutil.copy2(claude_json_path, backup_path)

        claude_json_path.write_text(
            json.dumps(config, indent=2) + "\n",
            encoding="utf-8"
        )
        print(f"UPDATED: {claude_json_path}")
        print(f"  mcpServers: {list(servers.keys())}")


def escape_toml_string(value: str) -> str:
    """Escape special characters for TOML double-quoted strings."""
    # TOML requires escaping backslash, double quote, and control characters
    value = value.replace("\\", "\\\\")  # Must be first
    value = value.replace('"', '\\"')
    value = value.replace("\n", "\\n")
    value = value.replace("\r", "\\r")
    value = value.replace("\t", "\\t")
    value = value.replace("\b", "\\b")
    value = value.replace("\f", "\\f")
    return value


def quote_toml_key(key: str) -> str:
    """Quote a TOML key if it contains special characters."""
    # TOML bare keys can only contain A-Za-z0-9_-
    # If key contains dots, spaces, or other special chars, it must be quoted
    if re.match(r'^[A-Za-z0-9_-]+$', key):
        return key
    return f'"{escape_toml_string(key)}"'


def convert_to_codex_toml(servers: dict[str, Any]) -> str:
    """Convert MCP servers config to Codex TOML format."""
    lines: list[str] = []

    for name, config in servers.items():
        quoted_name = quote_toml_key(name)
        lines.append(f"[mcp_servers.{quoted_name}]")

        server_type = config.get("type", "stdio")

        if server_type == "http":
            # HTTP/Streamable servers use url
            url = escape_toml_string(config.get("url", ""))
            lines.append(f'url = "{url}"')
        else:
            # STDIO servers use command + args
            command = escape_toml_string(config.get("command", ""))
            args = config.get("args", [])

            lines.append(f'command = "{command}"')
            if args:
                args_str = json.dumps(args)
                lines.append(f"args = {args_str}")

        # Handle env variables (for both HTTP and STDIO servers)
        env = config.get("env", {})
        if env:
            lines.append(f"")
            lines.append(f"[mcp_servers.{quoted_name}.env]")
            for key, value in env.items():
                quoted_key = quote_toml_key(key)
                escaped_value = escape_toml_string(str(value))
                lines.append(f'{quoted_key} = "{escaped_value}"')

        lines.append("")

    return "\n".join(lines)


def sync_to_codex(servers: dict[str, Any], dry_run: bool) -> None:
    """Sync MCP servers to Codex's ~/.codex/config.toml."""
    codex_dir = Path.home() / ".codex"
    config_path = codex_dir / "config.toml"

    if not codex_dir.exists():
        if dry_run:
            print(f"DRY-RUN: Would create {codex_dir}")
        else:
            codex_dir.mkdir(parents=True, exist_ok=True)

    # Read existing config
    existing_content = ""
    if config_path.exists():
        existing_content = config_path.read_text(encoding="utf-8")

    # Remove existing [mcp_servers.*] sections
    # This regex matches [mcp_servers.name] and everything until the next section header or EOF
    # Uses negative lookahead to only stop at [ that starts a new section (beginning of line)
    cleaned_content = re.sub(
        r'^\[mcp_servers\.[^\]]+\].*?(?=^\[(?!mcp_servers\.)|$(?![\r\n]))',
        '',
        existing_content,
        flags=re.MULTILINE | re.DOTALL
    )

    # Clean up extra blank lines
    cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content.strip())

    # Generate new MCP sections
    mcp_toml = convert_to_codex_toml(servers)

    # Combine
    if cleaned_content:
        new_content = cleaned_content + "\n\n" + mcp_toml
    else:
        new_content = mcp_toml

    if dry_run:
        print(f"DRY-RUN: Would update {config_path}")
        print(f"  mcp_servers: {list(servers.keys())}")
        print(f"\n--- Generated TOML ---\n{mcp_toml}")
    else:
        # Create backup
        if config_path.exists():
            backup_path = config_path.with_suffix(".toml.bak")
            shutil.copy2(config_path, backup_path)

        config_path.write_text(new_content, encoding="utf-8")
        print(f"UPDATED: {config_path}")
        print(f"  mcp_servers: {list(servers.keys())}")


def main() -> int:
    args = parse_args()

    try:
        servers = load_mcp_config()
    except FileNotFoundError as e:
        print(f"ERROR: {e}")
        return 1
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in mcp/servers.json: {e}")
        return 1

    print(f"Found {len(servers)} MCP server(s): {', '.join(servers.keys())}")
    print()

    sync_claude = not args.codex_only
    sync_codex = not args.claude_only

    if sync_claude:
        sync_to_claude(servers, args.dry_run)
        print()

    if sync_codex:
        sync_to_codex(servers, args.dry_run)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
