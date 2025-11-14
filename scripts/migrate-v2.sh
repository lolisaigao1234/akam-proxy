#!/bin/bash
# Migration script for akam-proxy v1.0.0 → v2.0.0
# Automates file relocation and configuration updates

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  akam-proxy v1.0.0 → v2.0.0 Migration                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "This script will migrate your akam-proxy installation to v2.0.0"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the akam-proxy root directory"
    exit 1
fi

echo "Checking current version..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"
echo ""

# Backup original files
echo "Creating backup..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "ip_list.txt" ]; then
    cp ip_list.txt "$BACKUP_DIR/"
    echo "✓ Backed up ip_list.txt"
fi

if [ -f "config.json5" ]; then
    cp config.json5 "$BACKUP_DIR/"
    echo "✓ Backed up config.json5"
fi

echo "Backup created in: $BACKUP_DIR"
echo ""

# Migrate ip_list.txt
echo "Migrating file locations..."

if [ -f "ip_list.txt" ] && [ ! -f "data/ip_list.txt" ]; then
    mkdir -p data
    mv ip_list.txt data/ip_list.txt
    echo "✓ Moved ip_list.txt → data/ip_list.txt"
elif [ -f "data/ip_list.txt" ]; then
    echo "✓ data/ip_list.txt already exists"
else
    echo "⚠ No ip_list.txt found (will be created on first run)"
fi

# Update config.json5 if it exists
if [ -f "config.json5" ]; then
    echo ""
    echo "Checking config.json5..."

    # Check if config has old scriptPath
    if grep -q "python/akamTester-master/akamTester.py" config.json5 2>/dev/null; then
        echo "⚠ Found old scriptPath in config.json5"
        echo "Creating updated config..."

        # Use sed to update the path
        sed -i.bak "s|python/akamTester-master/akamTester.py|tools/akamTester/akamTester.py|g" config.json5

        echo "✓ Updated scriptPath to tools/akamTester/akamTester.py"
        echo "  (Original saved as config.json5.bak)"
    else
        echo "✓ config.json5 looks good"
    fi

    # Check for legacy parameters
    if grep -q "refreshIpList" config.json5 2>/dev/null || grep -q "saveChinazResult" config.json5 2>/dev/null; then
        echo ""
        echo "⚠ WARNING: Legacy parameters detected in config.json5"
        echo "  The following parameters are no longer used:"
        echo "  - refreshIpList (removed)"
        echo "  - saveChinazResult (removed)"
        echo ""
        echo "  These parameters are ignored and can be safely removed."
        echo "  See config/example.json5 for the new configuration format."
    fi
fi

echo ""
echo "Verifying directory structure..."

# Ensure required directories exist
mkdir -p data
mkdir -p config
mkdir -p docs
mkdir -p tools
mkdir -p scripts

echo "✓ Directory structure verified"
echo ""

# Check if old directories can be removed
if [ -d "libs" ] && [ -z "$(ls -A libs)" ]; then
    rmdir libs
    echo "✓ Removed empty libs/ directory"
fi

if [ -d "utils" ] && [ -z "$(ls -A utils)" ]; then
    rmdir utils
    echo "✓ Removed empty utils/ directory"
fi

if [ -d "python" ] && [ -z "$(ls -A python)" ]; then
    rmdir python
    echo "✓ Removed empty python/ directory"
fi

if [ -d "screenshots" ] && [ -z "$(ls -A screenshots)" ]; then
    rmdir screenshots
    echo "✓ Removed empty screenshots/ directory"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Migration Complete!                                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Summary of changes:"
echo "  • Moved ip_list.txt to data/"
echo "  • Updated config.json5 paths (if needed)"
echo "  • Cleaned up old directories"
echo ""
echo "Your backups are in: $BACKUP_DIR/"
echo ""
echo "Next steps:"
echo "  1. Review your config.json5"
echo "  2. Run: npm install (to update dependencies)"
echo "  3. Run: npm test (to verify everything works)"
echo "  4. Run: npm start (to start the server)"
echo ""
echo "For help, see: docs/README.md"
echo ""
echo "Breaking changes in v2.0.0:"
echo "  • File locations changed (automatic migration done)"
echo "  • Import paths changed (only affects developers)"
echo "  • Legacy config parameters removed (ignored if present)"
echo ""
echo "See CHANGELOG.md for full details."
