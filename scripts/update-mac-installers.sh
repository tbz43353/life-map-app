#!/bin/bash

# Build Mac installers and copy to installers folder
# Usage: npm run update-mac-installers

set -e

echo "Building Mac installers..."
npm run electron:pack:mac

echo ""
echo "Copying installers to installers/1.0.0/mac/..."

# Create directory if it doesn't exist
mkdir -p installers/1.0.0/mac

# Copy DMG files
cp "release/Life Map-1.0.0.dmg" "installers/1.0.0/mac/"
cp "release/Life Map-1.0.0-arm64.dmg" "installers/1.0.0/mac/"

echo ""
echo "Done! Installers updated:"
ls -lah installers/1.0.0/mac/*.dmg
