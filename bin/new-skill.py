#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

from skill_utils import repo_root


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a new skill from the skeleton template")
    parser.add_argument("name", help="kebab-case skill name")
    parser.add_argument("--force", action="store_true", help="overwrite existing skill directory")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    name = args.name.strip()
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name):
        print("ERROR: skill name must be kebab-case")
        return 1

    root = repo_root()
    template = root / "templates" / "skill-skeleton"
    dest = root / "skills" / name

    if dest.exists():
        if not args.force:
            print(f"ERROR: {dest} already exists (use --force to overwrite)")
            return 1
        shutil.rmtree(dest)

    shutil.copytree(template, dest)

    skill_md = dest / "SKILL.md"
    content = skill_md.read_text(encoding="utf-8")
    content = content.replace("name: skill-name", f"name: {name}")
    content = content.replace("Short description of the skill", f"Short description for {name}")
    skill_md.write_text(content, encoding="utf-8")

    print(f"Created skill at {dest}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
