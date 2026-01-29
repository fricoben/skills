#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

FRONTMATTER_BOUNDARY = "---"

UNSAFE_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS access key id"),
    (re.compile(r"ASIA[0-9A-Z]{16}"), "AWS temporary access key id"),
    (re.compile(r"AIza[0-9A-Za-z\-_]{35}"), "Google API key"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "OpenAI API key"),
    (re.compile(r"sk-proj-[A-Za-z0-9]{10,}"), "OpenAI project API key"),
    (re.compile(r"ghp_[A-Za-z0-9]{30,}"), "GitHub personal access token"),
    (re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"), "Slack token"),
    (re.compile(r"-----BEGIN PRIVATE KEY-----"), "private key block"),
]

# Pattern for environment variable placeholders: ${VAR_NAME}
ENV_PLACEHOLDER_PATTERN = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")


@dataclass
class ValidationIssue:
    skill: str
    message: str


class FrontmatterError(ValueError):
    pass


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def skills_root() -> Path:
    return repo_root() / "skills"


def iter_skill_dirs(root: Path | None = None) -> Iterable[Path]:
    root = root or skills_root()
    if not root.exists():
        return []
    return [p for p in sorted(root.iterdir()) if p.is_dir() and (p / "SKILL.md").exists()]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def parse_frontmatter(text: str) -> Dict[str, str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != FRONTMATTER_BOUNDARY:
        raise FrontmatterError("missing frontmatter opening '---'")

    end_idx = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == FRONTMATTER_BOUNDARY:
            end_idx = idx
            break
    if end_idx is None:
        raise FrontmatterError("missing frontmatter closing '---'")

    block = lines[1:end_idx]
    data: Dict[str, str] = {}
    i = 0
    current_map_key: str | None = None
    while i < len(block):
        line = block[i]
        if not line.strip():
            i += 1
            current_map_key = None
            continue
        # Indented line: either a block scalar continuation or a nested map entry
        if line.startswith(" ") or line.startswith("\t"):
            if current_map_key is not None and ":" in line:
                # One-level nested key: e.g. "  internal: true" under "metadata:"
                sub_key, sub_rest = line.strip().split(":", 1)
                sub_key = sub_key.strip()
                sub_value = sub_rest.strip()
                if sub_value and len(sub_value) >= 2:
                    if (sub_value.startswith('"') and sub_value.endswith('"')) or (
                        sub_value.startswith("'") and sub_value.endswith("'")
                    ):
                        sub_value = sub_value[1:-1]
                data[f"{current_map_key}.{sub_key}"] = sub_value
                i += 1
                continue
            raise FrontmatterError(f"unexpected indentation at line {i + 2}")
        current_map_key = None
        if ":" not in line:
            raise FrontmatterError(f"invalid frontmatter line: {line}")
        key, rest = line.split(":", 1)
        key = key.strip()
        rest = rest.lstrip()
        if not key:
            raise FrontmatterError("empty key in frontmatter")
        if rest in (">", "|"):
            literal = rest == "|"
            collected: List[str] = []
            i += 1
            while i < len(block):
                next_line = block[i]
                if next_line.startswith(" ") or next_line.startswith("\t"):
                    collected.append(next_line.lstrip())
                    i += 1
                    continue
                break
            value = "\n".join(collected) if literal else " ".join(l.strip() for l in collected)
            data[key] = value.strip()
            continue
        value = rest.strip()
        if not value:
            # Empty value after colon: this is a map key (e.g. "metadata:")
            current_map_key = key
            i += 1
            continue
        if len(value) >= 2:
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
        data[key] = value
        i += 1
    return data


def detect_unsafe_patterns(content: str) -> List[str]:
    hits = []
    for pattern, label in UNSAFE_PATTERNS:
        if pattern.search(content):
            hits.append(label)
    return hits


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def validate_skill(skill_dir: Path) -> Tuple[Dict[str, str], List[ValidationIssue], List[ValidationIssue]]:
    errors: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []

    skill_name = skill_dir.name
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        errors.append(ValidationIssue(skill_name, "missing SKILL.md"))
        return {}, errors, warnings

    content = read_text(skill_file)
    try:
        frontmatter = parse_frontmatter(content)
    except FrontmatterError as exc:
        errors.append(ValidationIssue(skill_name, f"frontmatter error: {exc}"))
        return {}, errors, warnings

    name = frontmatter.get("name", "").strip()
    description = frontmatter.get("description", "").strip()

    if not name:
        errors.append(ValidationIssue(skill_name, "frontmatter 'name' is required"))
    elif name != skill_name:
        errors.append(ValidationIssue(skill_name, f"frontmatter name '{name}' does not match folder"))

    if not description:
        errors.append(ValidationIssue(skill_name, "frontmatter 'description' is required"))
    elif "trigger" not in description.lower():
        errors.append(ValidationIssue(skill_name, "description must include trigger terms"))

    unsafe = detect_unsafe_patterns(content)
    for label in unsafe:
        errors.append(ValidationIssue(skill_name, f"unsafe pattern detected: {label}"))

    wc = word_count(content)
    if wc > 2500 or len(content) > 15000:
        errors.append(ValidationIssue(skill_name, "SKILL.md is too long; move details to references/"))

    return frontmatter, errors, warnings


def issues_to_json(issues: List[ValidationIssue]) -> List[Dict[str, str]]:
    return [dict(skill=i.skill, message=i.message) for i in issues]


def emit_json(payload: Dict[str, object]) -> None:
    print(json.dumps(payload, sort_keys=True))


def find_placeholders(content: str) -> List[str]:
    """Find all ${VAR_NAME} placeholders in content."""
    return ENV_PLACEHOLDER_PATTERN.findall(content)


def substitute_placeholders(content: str, env: Dict[str, str]) -> Tuple[str, List[str]]:
    """
    Substitute ${VAR_NAME} placeholders with values from env dict.
    Returns (substituted_content, list_of_unresolved_placeholders).
    """
    unresolved: List[str] = []

    def replacer(match: re.Match) -> str:
        var_name = match.group(1)
        if var_name in env:
            return env[var_name]
        unresolved.append(var_name)
        return match.group(0)  # Keep original if not found

    result = ENV_PLACEHOLDER_PATTERN.sub(replacer, content)
    return result, unresolved


def check_unresolved_placeholders(content: str) -> List[str]:
    """Return list of placeholder variable names that appear in content."""
    return find_placeholders(content)
