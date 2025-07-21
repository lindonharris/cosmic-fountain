#!/bin/bash

# Dojo Debug - Self Update Script
# This script can be run from within a consumer repository to update Dojo Debug

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to find the-dojo directory
find_dojo_dir() {
    # Check common locations
    if [ -d "./the-dojo" ]; then
        echo "./the-dojo"
    elif [ -d "../the-dojo" ]; then
        echo "../the-dojo"
    elif [ -d "../../the-dojo" ]; then
        echo "../../the-dojo"
    else
        # Try to find it
        local found=$(find . -name "the-dojo" -type d 2>/dev/null | grep -v node_modules | head -1)
        if [ -n "$found" ]; then
            echo "$found"
        else
            return 1
        fi
    fi
}

# Function to get current version
get_current_version() {
    cd "$DOJO_DIR"
    git rev-parse HEAD 2>/dev/null || echo "unknown"
}

# Function to check for updates
check_for_updates() {
    cd "$DOJO_DIR"
    
    # Fetch latest
    echo -e "${BLUE}Checking for updates...${NC}"
    git fetch origin main --quiet 2>/dev/null || {
        echo -e "${RED}Error: Could not fetch from remote${NC}"
        return 1
    }
    
    local current=$(git rev-parse HEAD)
    local latest=$(git rev-parse origin/main)
    
    if [ "$current" = "$latest" ]; then
        echo -e "${GREEN}✓ Already up to date${NC} (${current:0:7})"
        return 1
    else
        echo -e "${YELLOW}↻ Update available${NC}"
        echo "  Current: ${current:0:7}"
        echo "  Latest:  ${latest:0:7}"
        
        # Show changes
        echo ""
        echo "Changes:"
        git log --oneline "$current..$latest" | head -10 | sed 's/^/  /'
        
        return 0
    fi
}

# Function to create backup
create_backup() {
    local backup_dir=".dojo-debug/backups"
    mkdir -p "$backup_dir"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local current_version=$(get_current_version)
    
    echo "{
  \"version\": \"$current_version\",
  \"timestamp\": \"$timestamp\",
  \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"type\": \"self-update\"
}" > "$backup_dir/backup_$timestamp.json"
    
    echo -e "${GREEN}✓ Backup created${NC}"
}

# Function to update
perform_update() {
    cd "$REPO_ROOT"
    
    # Stash any local changes
    cd "$DOJO_DIR"
    if ! git diff --quiet || ! git diff --cached --quiet; then
        echo -e "${YELLOW}Stashing local changes...${NC}"
        git stash push -m "Auto-stash before self-update $(date +%Y-%m-%d_%H:%M:%S)"
    fi
    
    # Update submodule
    cd "$REPO_ROOT"
    echo -e "${BLUE}Updating Dojo Debug...${NC}"
    
    if ! git submodule update --remote the-dojo; then
        echo -e "${RED}Error: Failed to update submodule${NC}"
        return 1
    fi
    
    # Get new version
    local new_version=$(cd "$DOJO_DIR" && git rev-parse HEAD)
    echo -e "${GREEN}✓ Updated to ${new_version:0:7}${NC}"
    
    # Update local installation info if it exists
    if [ -f ".dojo-debug/installation.json" ]; then
        local temp_file=".dojo-debug/installation.json.tmp"
        jq --arg version "$new_version" --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
            '.version = $version | .last_self_update = $date' \
            ".dojo-debug/installation.json" > "$temp_file"
        mv "$temp_file" ".dojo-debug/installation.json"
    fi
    
    return 0
}

# Parse arguments
AUTO_YES=false
CHECK_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -y|--yes)
            AUTO_YES=true
            shift
            ;;
        --check)
            CHECK_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Dojo Debug Self-Update"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -y, --yes      Auto-confirm update"
            echo "  --check        Check for updates only"
            echo "  -h, --help     Show this help"
            echo ""
            echo "Run this from your project root to update Dojo Debug"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Main execution
echo -e "${BLUE}Dojo Debug Self-Update${NC}"
echo "======================"
echo ""

# Find repository root
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

# Find the-dojo directory
DOJO_DIR=$(find_dojo_dir)
if [ -z "$DOJO_DIR" ]; then
    echo -e "${RED}Error: Could not find the-dojo directory${NC}"
    echo "Make sure you're in a repository with the-dojo as a submodule"
    exit 1
fi

echo -e "Repository: ${GREEN}$(basename "$REPO_ROOT")${NC}"
echo -e "Dojo Debug location: ${GREEN}$DOJO_DIR${NC}"
echo ""

# Check for updates
if ! check_for_updates; then
    exit 0
fi

# Check only mode
if [ "$CHECK_ONLY" = true ]; then
    exit 0
fi

# Confirm update
echo ""
if [ "$AUTO_YES" != true ]; then
    read -p "Do you want to update? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Update cancelled${NC}"
        exit 0
    fi
fi

# Create backup
create_backup

# Perform update
if perform_update; then
    echo ""
    echo -e "${GREEN}✓ Update completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Restart your application to load updated middleware"
    echo "2. Run verification: $DOJO_DIR/DOJO-DEBUG/verify-integration.sh"
    echo "3. Check for any breaking changes in the update"
else
    echo ""
    echo -e "${RED}✗ Update failed${NC}"
    echo "Check the error messages above and try again"
    exit 1
fi