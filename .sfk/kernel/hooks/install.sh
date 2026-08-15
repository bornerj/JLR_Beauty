#!/usr/bin/env bash
#
# Install SFK git hooks by pointing git at this versioned hooks folder.
# Run once per clone, from anywhere inside the repository.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hooks_dir=".sfk/kernel/hooks"

if [ ! -d "$repo_root/$hooks_dir" ]; then
  echo "❌ $hooks_dir not found. Run this from inside an SFK-managed repo." >&2
  exit 1
fi

chmod +x "$repo_root/$hooks_dir/pre-commit"
git -C "$repo_root" config core.hooksPath "$hooks_dir"

echo "✅ SFK hooks installed (core.hooksPath = $hooks_dir)."
echo "   The pre-commit hook now blocks significant commits missing a memory record."
echo "   Bypass a single commit with: git commit --no-verify"
