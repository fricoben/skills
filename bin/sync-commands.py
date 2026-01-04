#!/usr/bin/env python3
"""
Sync custom commands/prompts to Claude Code and Codex.

This script reads command files from commands/ and syncs them to:
  - Claude Code: ~/.claude/commands/ (invoked as /command-name)
  - Codex: ~/.codex/prompts/ (invoked as /prompts:command-name)
"""
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4


MARKER_FILE = ".managed-by-agent-skills-repo"


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync commands to Claude Code and Codex")
    parser.add_argument("--claude-dir", default=os.getenv("CLAUDE_COMMANDS_DIR", "~/.claude/commands"))
    parser.add_argument("--codex-dir", default=os.getenv("CODEX_PROMPTS_DIR", "~/.codex/prompts"))
    parser.add_argument("--dry-run", action="store_true", help="Show actions without copying")
    parser.add_argument("--prune", action="store_true", help="Remove previously managed commands not in source")
    parser.add_argument("--only", action="append", default=[], help="Limit to specific command name (repeatable)")
    return parser.parse_args()


def expand_dir(path_str: str) -> Path:
    return Path(os.path.expanduser(path_str)).resolve()


def git_value(args: list[str]) -> str:
    try:
        output = subprocess.check_output(
            ["git"] + args,
            stderr=subprocess.DEVNULL,
            cwd=repo_root(),
        ).decode().strip()
        return output if output else "unknown"
    except Exception:
        return "unknown"


def marker_contents(command_name: str) -> str:
    repo_url = git_value(["config", "--get", "remote.origin.url"])
    commit = git_value(["rev-parse", "HEAD"])
    timestamp = datetime.now(timezone.utc).isoformat()
    return "\n".join([
        f"repo: {repo_url}",
        f"commit: {commit}",
        f"timestamp_utc: {timestamp}",
        f"command: {command_name}",
        "",
    ])


def iter_command_files() -> list[Path]:
    """Iterate over all .md files in commands/ directory."""
    commands_dir = repo_root() / "commands"
    if not commands_dir.exists():
        return []
    return sorted([
        f for f in commands_dir.iterdir()
        if f.is_file() and f.suffix == ".md" and not f.name.startswith(".")
    ])


def copy_command(src: Path, dest_dir: Path, dry_run: bool) -> None:
    """Copy a command file to the destination directory."""
    dest = dest_dir / src.name
    marker_path = dest_dir / f".{src.stem}{MARKER_FILE}"

    if dry_run:
        print(f"DRY-RUN: copy {src} -> {dest}")
        return

    dest_dir.mkdir(parents=True, exist_ok=True)

    # Copy the command file
    shutil.copy2(src, dest)

    # Write marker file for this command
    marker_path.write_text(marker_contents(src.stem), encoding="utf-8")

    print(f"COPY: {src.name} -> {dest}")


def prune_managed(dest_dir: Path, keep: set[str], dry_run: bool) -> None:
    """Remove managed commands that are no longer in source."""
    if not dest_dir.exists():
        return

    for marker in dest_dir.glob(f".*{MARKER_FILE}"):
        # Extract command name from marker filename
        # Marker format: .command-name.managed-by-agent-skills-repo
        command_name = marker.name[1:].replace(MARKER_FILE, "")

        if command_name not in keep:
            command_file = dest_dir / f"{command_name}.md"
            if dry_run:
                print(f"DRY-RUN: prune {command_file}")
            else:
                if command_file.exists():
                    command_file.unlink()
                marker.unlink()
                print(f"PRUNE: {command_file}")


def main() -> int:
    args = parse_args()

    # Parse --only arguments
    only = []
    for item in args.only:
        only.extend([name.strip() for name in item.split(",") if name.strip()])
    only_set = set(only)

    # Get all command files
    command_files = iter_command_files()

    if only_set:
        command_files = [f for f in command_files if f.stem in only_set]
        missing = sorted(only_set - {f.stem for f in command_files})
        if missing:
            print(f"ERROR: unknown command(s): {', '.join(missing)}")
            return 1

    claude_dir = expand_dir(args.claude_dir)
    codex_dir = expand_dir(args.codex_dir)

    if not command_files:
        print("No commands found under ./commands")
        if args.prune and not only_set:
            prune_managed(claude_dir, set(), args.dry_run)
            prune_managed(codex_dir, set(), args.dry_run)
        return 0

    print(f"Found {len(command_files)} command(s): {', '.join(f.stem for f in command_files)}")
    print()

    # Sync to Claude Code
    print(f"Syncing to Claude Code ({claude_dir}):")
    for cmd_file in command_files:
        copy_command(cmd_file, claude_dir, args.dry_run)
    print()

    # Sync to Codex
    print(f"Syncing to Codex ({codex_dir}):")
    for cmd_file in command_files:
        copy_command(cmd_file, codex_dir, args.dry_run)

    # Prune orphaned commands
    if args.prune and not only_set:
        print()
        print("Pruning orphaned commands:")
        keep = {f.stem for f in command_files}
        prune_managed(claude_dir, keep, args.dry_run)
        prune_managed(codex_dir, keep, args.dry_run)
    elif args.prune and only_set:
        print()
        print("Skipping prune because --only was provided")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
