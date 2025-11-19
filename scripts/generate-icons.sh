#!/bin/bash

# Script to generate platform-specific icons from SVG
# Requires ImageMagick (install via: brew install imagemagick on macOS)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ICON_DIR="$PROJECT_ROOT/build/icons"
SVG_ICON="$ICON_DIR/icon.svg"

if [ ! -f "$SVG_ICON" ]; then
  echo "Error: SVG icon not found at $SVG_ICON"
  exit 1
fi

echo "Generating icons from $SVG_ICON..."

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "Error: ImageMagick (convert) is not installed."
  echo "Install it via: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
  exit 1
fi

cd "$ICON_DIR"

# Generate Linux PNG (512x512)
echo "Generating Linux PNG icon..."
convert -background none "$SVG_ICON" -resize 512x512 icon.png
echo "✓ Created icon.png"

# Generate Windows ICO
echo "Generating Windows ICO icon..."
convert -background none "$SVG_ICON" -define icon:auto-resize=256,128,64,48,32,16 icon.ico
echo "✓ Created icon.ico"

# Generate macOS ICNS (only on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Generating macOS ICNS icon..."
  
  # Create iconset directory
  ICONSET_DIR="icon.iconset"
  rm -rf "$ICONSET_DIR"
  mkdir -p "$ICONSET_DIR"
  
  # Generate all required sizes
  for size in 16 32 64 128 256 512 1024; do
    convert -background none "$SVG_ICON" -resize ${size}x${size} "$ICONSET_DIR/icon_${size}x${size}.png"
    convert -background none "$SVG_ICON" -resize $((size*2))x$((size*2)) "$ICONSET_DIR/icon_${size}x${size}@2x.png"
  done
  
  # Convert to .icns
  iconutil -c icns "$ICONSET_DIR"
  mv icon.icns .
  rm -rf "$ICONSET_DIR"
  echo "✓ Created icon.icns"
else
  echo "⚠ Skipping macOS ICNS generation (requires macOS and iconutil)"
  echo "  You can generate it manually on macOS using the instructions in build/icons/README.md"
fi

# Copy SVG to public directory for web favicon
echo "Copying SVG to public directory..."
mkdir -p "$PROJECT_ROOT/public"
cp "$SVG_ICON" "$PROJECT_ROOT/public/icon.svg"
echo "✓ Copied icon.svg to public/"

echo ""
echo "✓ Icon generation complete!"
echo ""
echo "Generated files:"
echo "  - $ICON_DIR/icon.png (Linux)"
echo "  - $ICON_DIR/icon.ico (Windows)"
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "  - $ICON_DIR/icon.icns (macOS)"
fi
echo "  - $PROJECT_ROOT/public/icon.svg (Web favicon)"

