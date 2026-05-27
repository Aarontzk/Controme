# Setup

> ⚠️ **Stack changed.** The project moved to the **Buildpad RAD platform**
> (Next.js 16 + Mantine v8 + DaaS + Supabase) — the app now lives at the repo root and the
> old FastAPI `backend/` + Vite `frontend/` were removed. For current setup use the README
> **Quick Start** (`pnpm install && pnpm dev`). The Python/Vite instructions below are
> retained for historical reference and are pending a rewrite.

## Prerequisites

- Git
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+ (or Supabase account)

## Clone

```bash
git clone https://github.com/AzkaTz/retas-siber-imut.git
cd retas-siber-imut
```

## Frontend (Azka)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
npm run lint
npm test
```

## Backend (Farel)

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn src.main:app --reload   # http://localhost:8000
# docs: http://localhost:8000/api/docs
pytest
```

## Database

```bash
# TBA after stack lock — migrations via Alembic
# alembic upgrade head
```

## Environment Variables

| Key | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing key — never commit the real value |
| `ALLOWED_ORIGINS` | JSON array of allowed CORS origins |
| `APP_ENV` | `development` / `staging` / `production` |

## Branch Strategy

```
main       → production
develop    → staging
feature/*  → open PR against develop
```
