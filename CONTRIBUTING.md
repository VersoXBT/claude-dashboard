# Contributing to Claude Dashboard

Thanks for your interest in contributing! This guide will help you get started.

## Quick Start

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/claude-dashboard.git
   cd claude-dashboard
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Start the dev server:
   ```bash
   pnpm dev
   ```

## Prerequisites

- Node.js 18+
- pnpm 9+

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |

## Pull Request Process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes
3. Ensure `pnpm build` passes without errors
4. Commit using [conventional commits](https://www.conventionalcommits.org/):
   ```
   feat: add new chart to overview page
   fix: correct session count in sidebar
   refactor: extract shared date formatting utils
   docs: update README installation steps
   ```
5. Push and open a Pull Request against `main`

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Immutable data patterns (no mutation)
- Small, focused files (under 800 lines)
- Use existing shadcn/ui components where possible
- Follow the patterns in existing pages for consistency

## Reporting Issues

Use [GitHub Issues](https://github.com/VersoXBT/claude-dashboard/issues) with the provided templates.
