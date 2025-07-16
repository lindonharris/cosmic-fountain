#!/bin/bash

echo "🧹 Removing safe-to-remove dojo artifacts..."

# Create backup before removal
mkdir -p .dojo/backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".dojo/backups/$(date +%Y%m%d_%H%M%S)"

# Extract safe-to-remove files from log
jq -r '.tracked_artifacts | to_entries[] | .value | to_entries[] | select(.value.safe_to_remove == true) | .key' .dojo/dependency-log.json | while read file; do
  if [[ -e "$file" ]]; then
    echo "🗑️  Removing: $file"
    
    # Backup before removal
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file" 2>/dev/null || echo "⚠️  Could not backup $file"
    
    # Remove the file
    rm "$file"
    
    # Log the removal
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) - Removed: $file" >> .dojo/removal-log.txt
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✅ Safe cleanup complete. Backups stored in: $BACKUP_DIR"