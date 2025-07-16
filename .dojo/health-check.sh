#!/bin/bash

echo "🏥 Dojo-MCP Health Check"

# Check for orphaned files
ORPHANED=$(find . -name "*dojo*" -type f | grep -v node_modules | grep -v .git | grep -v .dojo/)
if [[ -n "$ORPHANED" ]]; then
  echo "⚠️  Potential orphaned files found:"
  echo "$ORPHANED"
  echo "Consider adding to dependency log or removing"
fi

# Check log freshness
if [[ -f .dojo/dependency-log.json ]]; then
  LAST_UPDATE=$(jq -r '.timestamp' .dojo/dependency-log.json)
  echo "📅 Dependency log last updated: $LAST_UPDATE"
else
  echo "❌ No dependency log found"
fi

# Validate tracked files still exist
if [[ -f .dojo/dependency-log.json ]]; then
  MISSING_COUNT=0
  jq -r '.tracked_artifacts | to_entries[] | .value | to_entries[] | .key' .dojo/dependency-log.json | while read file; do
    if [[ ! -e "$file" ]]; then
      echo "❌ MISSING TRACKED FILE: $file"
      ((MISSING_COUNT++))
    fi
  done
  
  if [[ $MISSING_COUNT -eq 0 ]]; then
    echo "✅ All tracked files present"
  fi
fi