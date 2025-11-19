# Contributing to Life Map

Thank you for your interest in contributing to Life Map! This document provides guidelines and instructions for contributing to the project.

## How to Contribute

There are many ways to contribute to Life Map:

- **Report bugs** - Help us identify and fix issues
- **Suggest features** - Share ideas for new functionality
- **Improve documentation** - Help make the project easier to understand
- **Submit code** - Fix bugs or implement new features
- **Share feedback** - Let us know what you think

## Reporting Bugs

Before creating a bug report, please check existing [GitHub Issues](https://github.com/tbz43353/life-map-app/issues) to see if the problem has already been reported.

When creating a bug report, include:

- **Clear title** - Brief description of the issue
- **Description** - Detailed explanation of the problem
- **Steps to reproduce** - Exact steps to trigger the bug
- **Expected behavior** - What should happen
- **Actual behavior** - What actually happens
- **Screenshots** - If applicable
- **Environment**:
  - Operating system and version (macOS 14.2, Windows 11, Ubuntu 22.04, etc.)
  - Life Map version
  - Any relevant error messages

## Suggesting Features

Feature requests are welcome! When suggesting a feature:

1. Check if it's already been suggested in [GitHub Issues](https://github.com/tbz43353/life-map-app/issues)
2. Describe the feature and why it would be useful
3. Explain the use case - how would you use this feature?
4. Consider implementation details if you have ideas
5. Add mockups or examples if applicable

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)
- Git
- A code editor (VS Code recommended)

### Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork**:
```bash
git clone https://github.com/YOUR_USERNAME/life-map-app.git
cd life-map-app
```

3. **Add upstream remote**:
```bash
git remote add upstream https://github.com/tbz43353/life-map-app.git
```

4. **Install dependencies**:
```bash
npm install
```

5. **Run in development mode**:
```bash
npm run electron:dev
```

The app will launch with hot-reload enabled. Changes to the frontend will auto-refresh, but changes to the Electron main process require a restart.

### Project Structure

```
life-map-app/
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry point
│   └── preload.ts        # Preload script (IPC bridge)
├── src/                  # React frontend
│   ├── components/       # React components
│   ├── utils/            # Utility functions
│   ├── api.ts            # Electron IPC API wrapper
│   ├── types.ts          # TypeScript type definitions
│   ├── App.tsx           # Root component
│   └── main.tsx          # React entry point
├── samples/              # Sample .lifemap files
├── scripts/              # Build and utility scripts
└── build/                # Build configuration and assets
```

## Code Style

### General Guidelines

- **TypeScript** - Use TypeScript for all new code
- **Formatting** - Code will be formatted by Prettier (configured in the project)
- **Naming**:
  - Components: PascalCase (e.g., `TimelineView`)
  - Functions: camelCase (e.g., `calculateAge`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_AGE`)
  - Files: kebab-case for utilities, PascalCase for components

### TypeScript

- Enable strict mode
- Use interfaces for object shapes
- Avoid `any` type unless absolutely necessary
- Provide return types for functions

### React

- Use functional components with hooks
- Prefer named exports over default exports
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks

### Comments

- Write clear, concise comments for complex logic
- Document non-obvious decisions
- Use JSDoc for public APIs
- Keep comments up-to-date with code changes

## Making Changes

### Workflow

1. **Create a branch** for your changes:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. **Make your changes**:
   - Follow the code style guidelines
   - Keep commits logical and atomic
   - Write clear commit messages

3. **Test your changes**:
   - Run the app: `npm run electron:dev`
   - Test on multiple platforms if possible
   - Verify existing functionality still works

4. **Commit your changes**:
```bash
git add .
git commit -m "Brief description of changes

More detailed explanation if needed.
Fixes #123"  # Reference issue number if applicable
```

5. **Push to your fork**:
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request** on GitHub

### Commit Messages

Use clear, descriptive commit messages:

- **First line**: Brief summary (50 characters or less)
- **Body**: Detailed explanation (wrap at 72 characters)
- **Reference issues**: Include "Fixes #123" or "Closes #456"

Examples:
```
Add zoom controls to timeline

Implements zoom in/out buttons and keyboard shortcuts (Cmd/Ctrl + and -).
Zoom level is saved with the life map file.

Fixes #42
```

```
Fix timeline rendering bug on Windows

Timeline items were overlapping when zoom level exceeded 1.5 on Windows.
Adjusted positioning calculation to account for platform-specific rendering.

Fixes #78
```

## Pull Requests

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Changes have been tested locally
- [ ] No console errors or warnings
- [ ] New features include appropriate documentation
- [ ] Commit messages are clear and descriptive

### Pull Request Guidelines

1. **Title**: Clear, concise description of changes
2. **Description**: Explain what and why
   - What problem does this solve?
   - How does it work?
   - Any breaking changes?
3. **Link related issues**: Use "Fixes #123" or "Closes #456"
4. **Screenshots**: Include for UI changes
5. **Testing**: Describe what testing you've done

### Review Process

- Maintainer will review your PR
- May request changes or clarifications
- Be responsive to feedback
- Once approved, your PR will be merged

## Building and Testing

### Development Build

```bash
npm run build
```

Compiles TypeScript and bundles the app. Output in `dist/` and `dist-electron/`.

### Create Installers

```bash
# Build for your current platform
npm run electron:pack

# Build for specific platform
npm run electron:pack:mac
npm run electron:pack:win
npm run electron:pack:linux

# Build for all platforms (requires platform-specific tools)
npm run electron:pack:all
```

Installers are created in the `release/` directory.

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism gracefully
- Focus on what's best for the project and community

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Personal or political attacks
- Publishing others' private information

## Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/tbz43353/life-map-app/discussions) or [Issue](https://github.com/tbz43353/life-map-app/issues)
- **Stuck?** Don't hesitate to ask for help in your PR or issue

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Life Map! 🎉
