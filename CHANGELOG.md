# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-17

### Added
- Initial public release of Life Map
- Interactive timeline visualization for life events
- Customizable categories (Projects, Relationships, Residences, Remuneration, Inflection Points, Key Insights, Specific Goals)
- Category management (add, edit, delete, reorder)
- Timeline item management with rich editing
- Date of birth configuration with automatic age calculation
- Age range configuration (default 80 years)
- Dynamic max age feature - timeline items can automatically extend to life map's maximum age
- Color coding system (blue and red) for visual organization
- Zoom controls (0.8x to 1.4x)
- View modes: All Events, Past Events, Future Events
- Print functionality with landscape PDF generation
- Save/load life maps as `.lifemap` JSON files
- Recent files tracking
- Keyboard shortcuts:
  - `Cmd/Ctrl+N` - New Life Map
  - `Cmd/Ctrl+O` - Open File
  - `Cmd/Ctrl+S` - Save
  - `Cmd/Ctrl+Shift+S` - Save As
  - `Cmd/Ctrl+W` - Close File
  - `Cmd/Ctrl+P` - Print
- Cross-platform support:
  - macOS (Intel and Apple Silicon via Universal binary)
  - Windows (x64 and x86)
  - Linux (AppImage and deb packages)
- Sample life map included for demonstration
- Professional menu system with macOS-specific menus
- Application icon and branding
- All data stored locally (no cloud sync)
- Privacy-focused design

### Technical Details
- Built with Electron 33.2.1
- React 18.3.1 with TypeScript 5.8.3
- Vite 6.4.1 for fast development and building
- Tailwind CSS 3.4.18 for styling
- electron-builder for cross-platform packaging

## [Unreleased]

### Planned Features
- Dark mode support
- Export to PNG/SVG
- Import/export to other formats (CSV, Excel)
- Automatic updates (requires code signing)
- Additional timeline visualization options
- Cloud sync capability (optional)
- Collaboration features
- Mobile app companion

---

## Version History

- **1.0.0** (2025-01-17) - Initial public release

