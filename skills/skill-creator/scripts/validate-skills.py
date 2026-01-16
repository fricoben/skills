#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from skill_utils import emit_json, issues_to_json, iter_skill_dirs, validate_skill


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate skills under ./skills")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON output")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    skill_dirs = list(iter_skill_dirs())

    all_errors = []
    all_warnings = []

    for skill_dir in skill_dirs:
        _, errors, warnings = validate_skill(skill_dir)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    if args.json:
        emit_json({
            "skills": [p.name for p in skill_dirs],
            "errors": issues_to_json(all_errors),
            "warnings": issues_to_json(all_warnings),
        })
    else:
        for issue in all_errors:
            print(f"ERROR: {issue.skill}: {issue.message}", file=sys.stderr)
        for issue in all_warnings:
            print(f"WARN: {issue.skill}: {issue.message}", file=sys.stderr)
        if not skill_dirs:
            print("No skills found under ./skills", file=sys.stderr)

    return 1 if all_errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
