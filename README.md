# Retas Siber Imut

> CyberHack 2026 submission by Tim Retas Siber Imut (Aludra, Salsa, Azka, Farel).
> Industry partner: PT Indo Aneka Atsiri (Sima Arome).

**Status:** Buildpad/Next.js scaffold active. Vision QC PoC implemented at
`/poc/vision` with browser color, contamination, and texture checks.

## Live Demo

- Production: _TBA after Day 5 deploy_
- Staging: _TBA after Day 3 deploy_
- Demo video: _TBA_
- Pitch deck: _TBA_

## Quick Start

Stack: **Next.js 16 + Mantine v8 + Buildpad UI** (frontend, at repo root) → **Buildpad DaaS**
(backend) → **Supabase** (Postgres). Requires Node 24 + pnpm 10+.

```bash
git clone https://github.com/Aarontzk/Controme.git retas-siber-imut
cd retas-siber-imut
pnpm install
cp .mcp.json.example .mcp.json   # then fill DaaS tokens (see .env.local for live values)
pnpm dev                         # Next.js dev server → http://localhost:3000
```

Build / verify:

```bash
pnpm test
pnpm lint
pnpm tsc --noEmit
pnpm build
pnpm exec playwright test e2e/vision-poc.spec.ts
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

| Doc | Purpose |
|---|---|
| [docs/API.md](docs/API.md) | Endpoint contract |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database schema + ERD |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design + ADRs |
| [docs/SECURITY.md](docs/SECURITY.md) | RBAC, audit trail, encryption |
| [docs/SETUP.md](docs/SETUP.md) | Dev environment setup |
| [docs/VISION_POC.md](docs/VISION_POC.md) | Day 1 browser-only color QC PoC |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Implementation change history |

## Enterprise Readiness

Tracking 8 components per CyberHack rubric:

- [ ] Audit trail (immutable log of all mutations)
- [ ] RBAC (≥3 roles enforced backend + frontend)
- [ ] Policy enforcement (RLS or equivalent)
- [ ] Security (HTTPS, encryption at rest, secrets management)
- [ ] Scalability (stateless backend, DB indexing, CDN)
- [ ] Observability (logging, health check, error tracking)
- [ ] Clean documentation (README, API, schema, architecture)
- [ ] Deployability (CI/CD, staging + prod environments)

## Team

| Name | Role |
|---|---|
| Aludra | UI/UX Designer |
| Salsa | Concept & Market Researcher |
| Azka | Project Manager + Frontend Engineer |
| Farel | Backend Engineer |

## AI-Assisted Development (Claude Code + Codex)

This repo ships an AI agent toolkit (ported from the Buildpad scaffold and converted to
Claude/Codex-native formats). Two agents are expected to work in parallel — **Claude Code**
in one tab and **Codex** in the sidebar.

### Instructions

| File | Loaded by | Purpose |
|---|---|---|
| [`AGENTS.md`](AGENTS.md) | Codex (auto) | **Canonical** agent instructions — stack, rules, skills, MCP, collaboration |
| [`CLAUDE.md`](CLAUDE.md) | Claude Code (auto) | Imports `AGENTS.md` + Claude-specific notes |
| [`.github/copilot-instructions.md`](.github/copilot-instructions.md) | Copilot | Full Buildpad platform steering (authoritative — every hard rule & workflow) |

> Edit **`AGENTS.md`** to change instructions — `CLAUDE.md` imports it, so both agents stay
> in sync.

### Skills

`.claude/skills/<name>/SKILL.md` are reusable task playbooks for the Buildpad/Next.js stack.
Claude Code auto-discovers them as slash commands (`/create-project`, `/create-collection`,
`/review-code`, …); Codex reads them on demand. Full catalog in `AGENTS.md` §4.

### MCP servers

- **Claude Code** — copy [`.mcp.json.example`](.mcp.json.example) → `.mcp.json` (gitignored)
  and fill tokens.
- **Codex** — merge the `[mcp_servers.*]` blocks from [`.codex/config.toml`](.codex/) into
  your global `~/.codex/config.toml`. See [`.codex/README.md`](.codex/README.md).

The preconfigured servers (`buildpad`, `daas`, `buildpad-platform`) are the project's
DaaS backend + Buildpad CLI + Amplify management tools.

### Two-agent collaboration rules

Branch per task, commit small atomic slices, `git pull --rebase` before pushing, and never
have both agents edit `main` or the same files concurrently. Full rules in `AGENTS.md` §0.

## License

MIT — see [LICENSE](LICENSE).
