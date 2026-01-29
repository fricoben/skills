#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
AGENTS_DIR="$HOME/.agents/skills"

# Snapshot current skills in ~/.agents/skills/
before=()
if [ -d "$AGENTS_DIR" ]; then
  for d in "$AGENTS_DIR"/*/; do
    [ -d "$d" ] && before+=("$(basename "$d")")
  done
fi

# Run npx skills add with all user-provided arguments (global install)
npx skills add -g "$@"

# Snapshot after install
after=()
if [ -d "$AGENTS_DIR" ]; then
  for d in "$AGENTS_DIR"/*/; do
    [ -d "$d" ] && after+=("$(basename "$d")")
  done
fi

# Find newly added skills
new_skills=()
for skill in "${after[@]}"; do
  found=0
  for existing in "${before[@]}"; do
    if [ "$skill" = "$existing" ]; then
      found=1
      break
    fi
  done
  if [ "$found" -eq 0 ]; then
    new_skills+=("$skill")
  fi
done

# Copy new skills into the repo
if [ ${#new_skills[@]} -eq 0 ]; then
  echo "No new skills to add to the repository."
else
  for skill in "${new_skills[@]}"; do
    src="$AGENTS_DIR/$skill"
    dest="$SKILLS_DIR/$skill"
    if [ -d "$dest" ]; then
      echo "Skill '$skill' already exists in repo, skipping."
    else
      cp -R "$src" "$dest"
      echo "Added '$skill' to $SKILLS_DIR/$skill"
    fi
  done
fi
