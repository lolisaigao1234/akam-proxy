#!/bin/bash
# Setup script for akam-proxy
# Automates first-time setup and dependency installation

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  akam-proxy Setup Script                                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✓ Node.js found: $NODE_VERSION"
echo ""

# Check npm
echo "Checking npm installation..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo "✓ npm found: $NPM_VERSION"
echo ""

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install
echo "✓ Node.js dependencies installed"
echo ""

# Check for Python (optional)
echo "Checking Python installation (optional for IP discovery)..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python found: $PYTHON_VERSION"

    # Ask about Python dependencies
    read -p "Install Python dependencies for akamTester? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd tools/akamTester
        echo "Installing Python dependencies..."
        pip3 install -r requirements.txt
        echo "✓ Python dependencies installed"
        cd ../..
    fi
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    echo "✓ Python found: $PYTHON_VERSION"

    # Ask about Python dependencies
    read -p "Install Python dependencies for akamTester? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd tools/akamTester
        echo "Installing Python dependencies..."
        pip install -r requirements.txt
        echo "✓ Python dependencies installed"
        cd ../..
    fi
else
    echo "⚠ Python not found (optional - only needed for automatic IP discovery)"
fi
echo ""

# Create config file if it doesn't exist
if [ ! -f "config.json5" ]; then
    echo "Creating config.json5 from example..."
    cp config/example.json5 config.json5
    echo "✓ config.json5 created"
    echo ""
    echo "⚠ Please review and edit config.json5 before starting the server"
else
    echo "✓ config.json5 already exists"
fi
echo ""

# Check data directory
if [ ! -d "data" ]; then
    mkdir data
    echo "✓ Created data/ directory"
fi

# Check if IP list exists
if [ ! -f "data/ip_list.txt" ]; then
    echo "⚠ data/ip_list.txt not found"
    echo "Creating with example IPs (you should update this)..."

    cat > data/ip_list.txt << EOF
# IP list for CDN nodes
# Add one IP per line
# You can update this by running:
#   cd tools/akamTester
#   python akamTester.py -u upos-hz-mirrorakam.akamaized.net
2.16.11.163
23.45.67.89
EOF

    echo "✓ Created data/ip_list.txt with example IPs"
    echo "  Run 'cd tools/akamTester && python akamTester.py' to discover real IPs"
else
    IP_COUNT=$(wc -l < data/ip_list.txt)
    echo "✓ data/ip_list.txt exists ($IP_COUNT IPs)"
fi
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Review config.json5 and adjust settings if needed"
echo "2. Update data/ip_list.txt with actual CDN IPs"
echo "3. Run: npm start"
echo ""
echo "For help, see: docs/README.md"
