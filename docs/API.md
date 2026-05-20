# API Contract

_To be defined Day 2 (26 May 2026) by Backend Engineer._

## Conventions

- Base URL: `TBA`
- Auth: `Authorization: Bearer <jwt>`
- Response envelope:
  ```json
  {
    "success": true,
    "data": {},
    "error": null,
    "meta": { "page": 1, "limit": 20, "total": 0 }
  }
  ```

## Endpoints

### Health

- `GET /health` — liveness probe. Returns `200 { "status": "ok" }`.

### Auth

_TBA_

### Resources

_TBA — depends on problem statement (25 May)._

## Error Codes

| HTTP | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Missing/invalid token |
| 403 | RBAC denial |
| 404 | Resource not found |
| 409 | Conflict (duplicate, version mismatch) |
| 500 | Server error |
