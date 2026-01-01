#!/usr/bin/env python3
from __future__ import annotations

import argparse
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from skill_utils import (
    iter_skill_dirs,
    repo_root,
    validate_skill,
    substitute_placeholders,
    check_unresolved_placeholders,
)

MARKER_FILE = ".managed-by-agent-skills-repo"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync skills into Codex and Claude Code directories")
    parser.add_argument("--codex-dir", default=os.getenv("CODEX_SKILLS_DIR", "~/.codex/skills"))
    parser.add_argument("--claude-dir", default=os.getenv("CLAUDE_SKILLS_DIR", "~/.claude/skills"))
    parser.add_argument("--dry-run", action="store_true", help="show actions without copying")
    parser.add_argument("--prune", action="store_true", help="remove previously managed skills missing from canonical skills/")
    parser.add_argument("--only", action="append", default=[], help="limit to a specific skill name (repeatable)")
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


def marker_contents(skill_name: str) -> str:
    repo_url = git_value(["config", "--get", "remote.origin.url"])
    commit = git_value(["rev-parse", "HEAD"])
    timestamp = datetime.now(timezone.utc).isoformat()
    return "\n".join([
        f"repo: {repo_url}",
        f"commit: {commit}",
        f"timestamp_utc: {timestamp}",
        f"skill: {skill_name}",
        "",
    ])


TEXT_EXTENSIONS = {".md", ".txt", ".yaml", ".yml", ".json", ".py", ".sh"}


def substitute_file(file_path: Path, env: dict[str, str]) -> list[str]:
    """Substitute placeholders in a text file. Returns list of unresolved vars."""
    if file_path.suffix.lower() not in TEXT_EXTENSIONS:
        return []
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return []
    new_content, unresolved = substitute_placeholders(content, env)
    if new_content != content:
        file_path.write_text(new_content, encoding="utf-8")
    return unresolved


def substitute_directory(dir_path: Path, env: dict[str, str]) -> list[str]:
    """Recursively substitute placeholders in all text files. Returns unresolved vars."""
    all_unresolved: list[str] = []
    for file_path in dir_path.rglob("*"):
        if file_path.is_file():
            unresolved = substitute_file(file_path, env)
            all_unresolved.extend(unresolved)
    return all_unresolved


def copy_skill(src: Path, dest_root: Path, dry_run: bool, env: dict[str, str]) -> list[str]:
    """Copy skill to destination, substituting placeholders. Returns unresolved vars."""
    dest_root.mkdir(parents=True, exist_ok=True)
    dest = dest_root / src.name
    tmp = dest_root / f".{src.name}.tmp-{uuid4().hex}"

    if dry_run:
        print(f"DRY-RUN: copy {src} -> {dest}")
        return []

    if tmp.exists():
        shutil.rmtree(tmp)

    shutil.copytree(src, tmp)

    # Substitute environment variable placeholders
    unresolved = substitute_directory(tmp, env)

    marker_path = tmp / MARKER_FILE
    marker_path.write_text(marker_contents(src.name), encoding="utf-8")

    if dest.exists():
        shutil.rmtree(dest)

    tmp.rename(dest)
    print(f"COPY: {src.name} -> {dest}")
    return unresolved


def prune_managed(dest_root: Path, keep: set[str], dry_run: bool) -> None:
    if not dest_root.exists():
        return
    for child in sorted(dest_root.iterdir()):
        marker = child / MARKER_FILE
        if child.is_dir() and marker.exists() and child.name not in keep:
            if dry_run:
                print(f"DRY-RUN: prune {child}")
            else:
                shutil.rmtree(child)
                print(f"PRUNE: {child}")


def main() -> int:
    args = parse_args()
    only = []
    for item in args.only:
        only.extend([name for name in item.split(",") if name])
    only_set = set(only)

    skill_dirs = list(iter_skill_dirs())
    if only_set:
        skill_dirs = [p for p in skill_dirs if p.name in only_set]
        missing = sorted(only_set - {p.name for p in skill_dirs})
        if missing:
            print(f"ERROR: unknown skill(s): {', '.join(missing)}")
            return 1

    all_errors = []
    for skill_dir in skill_dirs:
        _, errors, _ = validate_skill(skill_dir)
        all_errors.extend(errors)

    if all_errors:
        for issue in all_errors:
            print(f"ERROR: {issue.skill}: {issue.message}")
        return 1

    codex_dir = expand_dir(args.codex_dir)
    claude_dir = expand_dir(args.claude_dir)

    if not skill_dirs:
        print("No skills found under ./skills")
        return 0

    # Get environment variables for placeholder substitution
    env = dict(os.environ)

    all_unresolved: set[str] = set()
    for skill_dir in skill_dirs:
        unresolved = copy_skill(skill_dir, codex_dir, args.dry_run, env)
        all_unresolved.update(unresolved)
        unresolved = copy_skill(skill_dir, claude_dir, args.dry_run, env)
        all_unresolved.update(unresolved)

    if all_unresolved:
        print(f"WARNING: unresolved placeholders: {', '.join(sorted(all_unresolved))}")
        print("  Hint: run with 'dotenvx run -- python3 bin/sync-skills.py' to inject secrets")

    if args.prune and not only_set:
        keep = {p.name for p in skill_dirs}
        prune_managed(codex_dir, keep, args.dry_run)
        prune_managed(claude_dir, keep, args.dry_run)
    elif args.prune and only_set:
        print("Skipping prune because --only was provided")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
