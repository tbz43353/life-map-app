# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Life Map, please report it responsibly:

### How to Report

**Please do NOT create a public GitHub issue for security vulnerabilities.**

Instead, please send a private disclosure via one of these methods:

1. **GitHub Security Advisories** (Recommended):
   - Go to the [Security tab](https://github.com/tbz43353/life-map-app/security/advisories)
   - Click "Report a vulnerability"
   - Fill out the form with details

2. **Email** (if GitHub Security Advisories unavailable):
   - Send an email to: [Your contact email - add when ready]
   - Include "SECURITY" in the subject line
   - Provide detailed information about the vulnerability

### What to Include

Please include as much information as possible:

- **Type of vulnerability** (e.g., code injection, XSS, file access, etc.)
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Affected versions**
- **Suggested fix** (if you have one)
- **Your contact information** (for follow-up questions)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-30 days
  - Medium: 30-90 days
  - Low: Next release cycle

### Disclosure Policy

- We will work with you to understand and fix the issue
- We ask that you keep the vulnerability confidential until we've released a fix
- We will acknowledge your responsible disclosure in the release notes (unless you prefer to remain anonymous)
- Once fixed, we will publish a security advisory describing the issue and crediting you (if desired)

## Security Best Practices for Users

### Data Privacy

- **Local Storage**: Life Map stores all your data locally on your computer
- **No Cloud Sync**: No data is sent to external servers or the internet
- **File Format**: `.lifemap` files are JSON text files that you can inspect
- **Backup**: Regularly back up your `.lifemap` files to prevent data loss

### Safe Usage

1. **Download from Official Sources**:
   - Only download Life Map from [GitHub Releases](https://github.com/tbz43353/life-map-app/releases)
   - Verify checksums when available

2. **File Safety**:
   - Only open `.lifemap` files from trusted sources
   - Be cautious with `.lifemap` files received from unknown sources
   - The app only reads data files - it doesn't execute code from them

3. **Privacy Considerations**:
   - Life maps may contain personal/sensitive information
   - Be mindful when sharing `.lifemap` files
   - Use file encryption if storing sensitive life maps
   - Consider file permissions on shared computers

4. **Operating System Security**:
   - Keep your operating system updated
   - Use reputable antivirus software
   - Follow platform-specific security best practices

### Unsigned Builds

Current releases are **not code-signed** due to certificate costs. This means:

- **macOS**: You'll see a "from unidentified developer" warning
  - Right-click the app and select "Open" to bypass
  - Or use System Preferences → Security & Privacy to allow

- **Windows**: You may see SmartScreen warnings
  - Click "More info" → "Run anyway"

**Note**: Code signing is planned for future releases once the project has sufficient support.

## Known Limitations

### Current Security Considerations

1. **No Encryption**: `.lifemap` files are stored as plain JSON
   - Anyone with file access can read your life maps
   - Use OS-level encryption if needed (FileVault, BitLocker, etc.)

2. **No Password Protection**: Files are not password-protected
   - Consider this when storing sensitive information

3. **Print Privacy**: Print/PDF output contains all visible timeline data
   - Review before printing or sharing

### Future Enhancements

We're considering these security improvements:

- Optional file encryption with password protection
- File integrity verification (checksums/signatures)
- Code signing for macOS and Windows releases
- Secure cloud sync option (opt-in)
- Data export with redaction options

## Security Updates

Security updates will be:

- Released as patch versions (e.g., 1.0.1)
- Announced in the CHANGELOG.md
- Published as GitHub Security Advisories
- Noted in GitHub Releases

## Questions?

If you have questions about security that are not sensitive:
- Open a [GitHub Issue](https://github.com/tbz43353/life-map-app/issues)
- Start a [GitHub Discussion](https://github.com/tbz43353/life-map-app/discussions)

For security-related questions:
- Use the private disclosure methods above

---

Thank you for helping keep Life Map secure! 🔒
