#!/bin/bash

echo "🔍 Validating dependency log against current state..."

# Check if logged files still exist
jq -r '.tracked_artifacts | to_entries[] | .value | to_entries[] | .key' .dojo/dependency-log.json | while read file; do
  if [[ ! -e "$file" ]]; then
    echo "❌ MISSING: $file (logged but not found)"
  else
    echo "✅ EXISTS: $file"
  fi
done

# Find unlisted dojo files
echo -e "\n🔍 Checking for unlisted dojo artifacts..."
find . -name "*dojo*" -type f | grep -v node_modules | grep -v .git | while read file; do
  if ! jq -e --arg file "$file" '.tracked_artifacts | to_entries[] | .value | has($file)' .dojo/dependency-log.json >/dev/null 2>&1; then
    echo "⚠️  UNLISTED: $file"
  fi
done