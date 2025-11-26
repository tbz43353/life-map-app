# Life Map v1.0.0

The first public release of Life Map - a desktop application for creating and visualizing life timelines.

## Features

- **Interactive Timeline Visualization** - See your entire life at a glance with a clean, organized timeline
- **Customizable Categories** - Organize events by projects, relationships, residences, career, insights, and goals
- **Flexible Input Modes** - Enter timeline items using ages or specific dates
- **Dynamic Age Ranges** - Items can automatically extend to your maximum age using the "Max" option
- **Color Coding** - Visual differentiation with blue and red color schemes
- **Zoom Controls** - Adjust the timeline scale for better visibility
- **View Modes** - Filter between All Events, Past Events, or Future Events
- **Category Management** - Add, edit, reorder, and customize categories
- **Print & Export** - Print your life map with customizable PDF generation
- **Local Storage** - All data stays on your computer in simple `.lifemap` JSON files
- **Multiple Windows** - Open multiple life maps simultaneously

## Downloads

### macOS
| File | Description |
|------|-------------|
| `Life.Map-1.0.0-arm64.dmg` | Apple Silicon (M1/M2/M3) Macs |
| `Life.Map-1.0.0.dmg` | Intel Macs |

**First Launch:** The app is not code-signed, so macOS will block it. Use one of these methods:

- **Method A: System Settings (Recommended)** - Try to open Life Map (it will be blocked), then go to **System Settings** → **Privacy & Security**, scroll down to find "Life Map was blocked", and click **"Open Anyway"**

- **Method B: Right-Click Open** - In Finder, right-click (or Control-click) on Life Map and select **"Open"**, then click **"Open"** in the dialog

**Troubleshooting:** If you see "Life Map is damaged and can't be opened", open Terminal and run:
```
xattr -cr /Applications/Life\ Map.app
```

### Windows
| File | Description |
|------|-------------|
| `Life.Map.Setup.1.0.0.exe` | Windows 10+ (64-bit) |

**Note:** Windows SmartScreen may warn about the app - click "More info" → "Run anyway" (app is not yet code-signed).

## Getting Started

1. Download the installer for your platform
2. Install and launch Life Map
3. Click the settings icon (⚙️) to set your date of birth and maximum age
4. Click on any category row to add timeline items
5. Save your work with File → Save (or Cmd/Ctrl+S)

## Known Issues

- Apps are not code-signed, requiring manual bypass of OS security warnings on first launch
- Linux builds are not yet available

## Feedback

Found a bug or have a feature request? Please [open an issue](https://github.com/tbz43353/life-map-app/issues) on GitHub.

## Support

If you find Life Map useful, consider supporting development:
- ⭐ Star the repository
- ☕ [Buy me a coffee on Ko-fi](https://ko-fi.com/tonybiz)

---

**Full Changelog**: https://github.com/tbz43353/life-map-app/commits/v1.0.0
