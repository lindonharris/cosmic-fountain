#!/bin/bash

echo "🧠 Scanning Claude memory for outdated dojo references..."

if [[ -f .claude/CLAUDE.md ]]; then
  echo "=== Checking for deleted dojo features ==="
  
  # Common deleted features to check for
  DELETED_FEATURES=(
    "debug_issue"
    "error.tracking"
    "error_tracking" 
    "boost.claude"
    "claude.booster"
    "file.access.learning"
    "smart.shortcuts"
    "omniscient"
    "pattern.learning"
  )
  
  for feature in "${DELETED_FEATURES[@]}"; do
    if grep -i "$feature" .claude/CLAUDE.md >/dev/null 2>&1; then
      echo "⚠️  Found reference to deleted feature: $feature"
      grep -n -i "$feature" .claude/CLAUDE.md
    fi
  done
  
  # Check for specific deleted commands
  if grep -E "(dojo-mcp.*debug_issue|boost-claude|error-tracker)" .claude/CLAUDE.md >/dev/null 2>&1; then
    echo "❌ Found references to deleted commands"
    grep -n -E "(dojo-mcp.*debug_issue|boost-claude|error-tracker)" .claude/CLAUDE.md
  fi
  
  echo "✅ Claude memory scan complete"
else
  echo "ℹ️  No Claude memory file found"
fi