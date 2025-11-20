# Life Map Application Icons

This directory contains the application icons for Life Map.

## Icon Files

- `icon.svg` - Source SVG icon (512x512)
- `icon.icns` - macOS icon bundle (required for macOS builds)
- `icon.ico` - Windows icon file (required for Windows builds)
- `icon.png` - Linux icon file (required for Linux builds)

## Generating Icon Files

The SVG icon needs to be converted to platform-specific formats. Here are instructions for each platform:

### macOS (.icns)

1. Create an iconset directory:
   ```bash
   mkdir -p icon.iconset
   ```

2. Generate PNG files at different sizes:
   ```bash
   # Using ImageMagick (install via: brew install imagemagick)
   for size in 16 32 64 128 256 512 1024; do
     convert -background none icon.svg -resize ${size}x${size} icon.iconset/icon_${size}x${size}.png
     convert -background none icon.svg -resize $((size*2))x$((size*2)) icon.iconset/icon_${size}x${size}@2x.png
   done
   ```

3. Convert to .icns:
   ```bash
   iconutil -c icns icon.iconset
   mv icon.icns build/icons/
   rm -rf icon.iconset
   ```

### Windows (.ico)

Using ImageMagick:
```bash
convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
mv icon.ico build/icons/
```

Or use an online converter like:
- https://convertio.co/svg-ico/
- https://cloudconvert.com/svg-to-ico

### Linux (.png)

Using ImageMagick:
```bash
convert icon.svg -resize 512x512 icon.png
mv icon.png build/icons/
```

## Quick Setup (macOS with ImageMagick)

If you have ImageMagick installed, you can run:

```bash
cd build/icons

# Generate all formats
convert icon.svg -resize 512x512 icon.png

# For macOS .icns (requires iconutil)
mkdir -p icon.iconset
for size in 16 32 64 128 256 512 1024; do
  convert -background none icon.svg -resize ${size}x${size} icon.iconset/icon_${size}x${size}.png
  convert -background none icon.svg -resize $((size*2))x$((size*2)) icon.iconset/icon_${size}x${size}@2x.png
done
iconutil -c icns icon.iconset
mv icon.icns .
rm -rf icon.iconset

# For Windows .ico
convert icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

## Note

The placeholder text files (icon.icns, icon.ico, icon.png) should be replaced with actual binary icon files before building installers. The build will fail if these files are missing or invalid.

