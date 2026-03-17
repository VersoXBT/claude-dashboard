# Security Policy

## Local-Only Design

Claude Dashboard is designed to run entirely on your local machine. It reads Claude Code session data from your local `~/.claude` directory. **No data is ever sent to any external server.**

All processing happens locally:
- Data is read from your filesystem
- The dashboard runs on `localhost`
- No analytics, telemetry, or external API calls

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub issue
2. Email the maintainer or open a [GitHub Security Advisory](https://github.com/VersoXBT/claude-dashboard/security/advisories/new)
3. Include a description of the vulnerability and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

We aim to acknowledge reports within 48 hours and provide a fix within 7 days for critical issues.
