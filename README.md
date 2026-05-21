# Retas Siber Imut

> CyberHack 2026 submission by Tim Retas Siber Imut (Aludra, Salsa, Azka, Farel).
> Industry partner: PT Indo Aneka Atsiri (Sima Arome).

**Status:** Scaffolding — problem statement releases 25 May 2026.

## Live Demo

- Production: _TBA after Day 5 deploy_
- Staging: _TBA after Day 3 deploy_
- Demo video: _TBA_
- Pitch deck: _TBA_

## Quick Start

```bash
git clone https://github.com/AzkaTz/retas-siber-imut.git
cd retas-siber-imut
# frontend setup — TBA after stack lock (24 May)
# backend setup  — TBA after stack lock (24 May)
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

## License

MIT — see [LICENSE](LICENSE).
