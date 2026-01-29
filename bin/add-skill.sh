#!/usr/bin/env bash
set -eo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
AGENTS_DIR="$HOME/.agents/skills"

# Portable hash: works on macOS (md5) and Linux (md5sum)
hash_dir() {
  find "$1" -type f -print0 | sort -z | xargs -0 cat 2>/dev/null | md5sum 2>/dev/null || md5
}

# Snapshot current skill hashes to a temp file (Bash 3.2 compatible, no associative arrays)
BEFORE_FILE="$(mktemp)"
trap 'rm -f "$BEFORE_FILE"' EXIT
if [ -d "$AGENTS_DIR" ]; then
  for d in "$AGENTS_DIR"/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    echo "$name=$(hash_dir "$d")" >> "$BEFORE_FILE"
  done
fi

# Run npx skills add with all user-provided arguments (global install)
npx skills add -g "$@"

# Compare after install
added=0
updated=0
if [ -d "$AGENTS_DIR" ]; then
  for d in "$AGENTS_DIR"/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    after_hash="$(hash_dir "$d")"
    dest="$SKILLS_DIR/$name"

    if [ ! -d "$dest" ]; then
      cp -R "$d" "$dest"
      echo "Added '$name' to $dest"
      added=$((added + 1))
    else
      before_hash="$(grep "^${name}=" "$BEFORE_FILE" 2>/dev/null | cut -d= -f2- || true)"
      if [ -n "$before_hash" ] && [ "$before_hash" != "$after_hash" ]; then
        rm -rf "$dest"
        cp -R "$d" "$dest"
        echo "Updated '$name' in $dest"
        updated=$((updated + 1))
      fi
    fi
  done
fi

if [ "$added" -eq 0 ] && [ "$updated" -eq 0 ]; then
  echo "No new or updated skills to add to the repository."
else
  echo ""
  echo "Done: $added added, $updated updated."
fi
