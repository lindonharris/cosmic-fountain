#!/bin/bash

echo "🔍 Discovering dojo-mcp artifacts..."

# Find all dojo-related files
echo "=== Files containing 'dojo' ==="
find . -type f -name "*dojo*" | grep -v node_modules | grep -v .git

echo -e "\n=== Files mentioning 'dojo-mcp' in content ==="
grep -r "dojo-mcp" . --include="*.json" --include="*.js" --include="*.ts" --include="*.md" --include="*.yml" --include="*.yaml" --exclude-dir=node_modules --exclude-dir=.git | cut -d: -f1 | sort -u

echo -e "\n=== Package.json dependencies ==="
grep -E "(dojo|@dojo)" package*.json 2>/dev/null || echo "No package.json dependencies found"

echo -e "\n=== Configuration files ==="
find . -name "*dojo*.config.*" -o -name "dojo*.json" -o -name ".dojo*" | grep -v node_modules

echo -e "\n=== Scripts and binaries ==="
find . -path "*/bin/*dojo*" -o -name "*dojo*.sh" -o -name "*dojo*.py" | grep -v node_modules

echo -e "\n=== Documentation and guides ==="
find . -name "*dojo*.md" -o -name "*DOJO*" | grep -v node_modules

echo -e "\n=== Environment and Docker files ==="
grep -l "dojo" .env* docker* compose* 2>/dev/null || echo "No environment files found"

echo -e "\n=== Claude configuration ==="
find . -path "*/.claude/*" -name "*dojo*" 2>/dev/null || echo "No Claude dojo files found"