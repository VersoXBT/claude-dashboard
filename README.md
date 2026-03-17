<div align="center">

# Claude Dashboard

**A beautiful local dashboard to track your Claude Code usage, costs, and session history**

[![npm version](https://img.shields.io/npm/v/claude-dashboard.svg)](https://www.npmjs.com/package/claude-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/VersoXBT/claude-dashboard)](https://github.com/VersoXBT/claude-dashboard/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## Quick Start

```bash
npx claude-dashboard
```

That's it. Open [http://localhost:3000](http://localhost:3000) and explore your Claude Code usage.

### Requirements

- **Node.js** 18.0.0 or higher
- **Claude Code** CLI installed and used at least once (creates `~/.claude/` with usage data)

## Features

- **Usage Tracking** -- Total sessions, messages, and tokens across all your projects
- **Cost Breakdown** -- Estimated API-equivalent costs by model, day, week, and month
- **Session History** -- Browse, search, and drill into every Claude Code conversation
- **Token Analytics** -- Input, output, cache read, and cache creation token breakdowns
- **Project Insights** -- Leaderboard, treemap visualization, and per-project session history
- **Activity Heatmaps** -- See when you code with Claude by hour and day
- **Live Monitoring** -- Real-time view of active Claude Code sessions
- **Privacy First** -- All data stays local. Nothing is sent to any external server.

## Installation

### npx (recommended)

```bash
npx claude-dashboard
```

### Global install

```bash
npm install -g claude-dashboard
claude-dashboard
```

### From source

```bash
git clone https://github.com/VersoXBT/claude-dashboard.git
cd claude-dashboard
pnpm install
pnpm dev
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 9+

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with Turbopack |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm build:cli` | Build the CLI entry point |

## Tech Stack

Built with [Next.js 15](https://nextjs.org/), [shadcn/ui](https://ui.shadcn.com/), [Recharts](https://recharts.org/), [Tailwind CSS](https://tailwindcss.com/), and [SWR](https://swr.vercel.app/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute.

## License

[MIT](LICENSE) -- VersoXBT
