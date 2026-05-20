# Linear Seed Spec

Spec untuk inisialisasi Linear workspace via Linear MCP. Setelah Linear MCP auth, sesi Claude baru baca file ini dan eksekusi.

## Workspace

- **Team name:** Retas Siber Imut
- **Team key (suggested):** RSI
- **Cycle:** "CyberHack Sprint" — 25 Mei 2026 → 31 Mei 2026 (7 hari, termasuk submission day)

## Projects (Linear sub-projects)

| Project | Description |
|---|---|
| MVP Features | Fitur utama yg masuk demo. Issue diturunkan dari problem statement (release 25 Mei). |
| Infrastructure & DevOps | Repo, CI/CD, deploy, environment, monitoring. |
| Submission Deliverables | Pitch deck, demo video, README final, Devpost form. |

## Labels

### `phase:*` (warna: biru)
- `phase:foundation` — Day 1
- `phase:design` — Day 2
- `phase:build` — Day 3-4
- `phase:hardening` — Day 5
- `phase:demo` — Day 6
- `phase:submission` — Day 7

### `role:*` (warna: hijau)
- `role:frontend`
- `role:backend`
- `role:design`
- `role:research`
- `role:devops`

### `priority:*` (warna: merah/oranye/kuning)
- `priority:p0` — Blocker, harus selesai hari itu
- `priority:p1` — Penting, slip = risk
- `priority:p2` — Nice-to-have

### Flag (warna: ungu)
- `blocker`
- `urgent`
- `technical-debt`

### `needs:*` (warna: abu-abu — enterprise readiness tags)
- `needs:audit-trail`
- `needs:rbac`
- `needs:security`
- `needs:docs`
- `needs:deploy`

## Issue Tree (Hybrid: 7 parent + sub-issue per deliverable)

### Parent: Day 1 — Foundation (25 Mei)
Labels: `phase:foundation`, `priority:p0`
Project: Infrastructure & DevOps
Due: 2026-05-25

**Sub-issues:**
1. Baca brief + interpretasi requirements (`role:research`)
2. Lock MVP scope 3-5 fitur (`role:research`, `priority:p0`)
3. Susun user flow kasar di whiteboard (`role:design`)
4. Definisi entitas data utama (`role:backend`)
5. Setup repo structure + push initial (`role:devops`) — _DONE pre-hackathon_
6. Design system foundation: colors + typography (`role:design`)
7. Commit pertama Day 1 → push ke develop (`role:devops`)
8. Daily sync di kafe — kumpul offline (`priority:p0`)

### Parent: Day 2 — Design + Schema (26 Mei)
Labels: `phase:design`, `priority:p0`
Project: Infrastructure & DevOps
Due: 2026-05-26

**Sub-issues:**
1. Wireframe hi-fi semua screen MVP (`role:design`, `needs:docs`)
2. Setup design system di Figma — components final (`role:design`)
3. Database schema + ERD (`role:backend`, `needs:docs`)
4. RBAC role definition: admin/operator/end-user (`role:backend`, `needs:rbac`)
5. API contract draft — endpoint, request, response (`role:backend`, `needs:docs`)
6. Setup auth: Cognito atau Supabase Auth (`role:backend`, `needs:security`)
7. Frontend routing + skeleton (`role:frontend`)
8. Feature brief finalized (`role:research`, `needs:docs`)
9. Kumpul kafe: Design Handoff meeting

### Parent: Day 3 — Core Build (27 Mei)
Labels: `phase:build`, `priority:p0`
Project: MVP Features
Due: 2026-05-27

**Sub-issues:**
1. Implement CRUD endpoint entitas utama (`role:backend`)
2. Audit trail middleware/trigger (`role:backend`, `needs:audit-trail`)
3. RBAC enforcement di endpoint (`role:backend`, `needs:rbac`)
4. Frontend: implement screen list utama (`role:frontend`)
5. Frontend: integrate auth flow (`role:frontend`, `needs:security`)
6. API contract finalization (`role:backend`, `role:frontend`, `needs:docs`)
7. Deploy backend ke staging (`role:devops`, `needs:deploy`)
8. Deploy frontend ke staging (`role:devops`, `needs:deploy`)

### Parent: Day 4 — Feature Build (28 Mei)
Labels: `phase:build`, `priority:p0`
Project: MVP Features
Due: 2026-05-28

**Sub-issues:**
1. Lanjut implementasi fitur tersisa (`role:frontend`, `role:backend`)
2. Integrasi FE ke BE — buang mock data (`role:frontend`)
3. Form validation + error handling (`role:frontend`, `role:backend`)
4. Mulai isi konten pitch deck (`role:research`)
5. Test fitur per fitur (semua role)
6. Bug triage + prioritization (`priority:p1`)

### Parent: Day 5 — Integration + Enterprise Hardening (29 Mei)
Labels: `phase:hardening`, `priority:p0`
Project: Infrastructure & DevOps
Due: 2026-05-29

**Sub-issues (semua punya minimal 1 `needs:*` tag):**
1. End-to-end testing (semua role)
2. Bug fixing prioritas tinggi (`priority:p0`)
3. Audit trail UI — admin lihat log (`role:frontend`, `needs:audit-trail`)
4. RBAC verification per role (`role:backend`, `needs:rbac`)
5. Security review checklist (`role:backend`, `needs:security`)
6. README finalization (`role:devops`, `needs:docs`)
7. API docs finalization (`role:backend`, `needs:docs`)
8. Architecture diagram finalization (`role:devops`, `needs:docs`)
9. Deploy ke production environment (`role:devops`, `needs:deploy`)
10. Setup health check endpoint + logging (`role:backend`, `needs:security`)

### Parent: Day 6 — Polish + Demo Prep (30 Mei)
Labels: `phase:demo`, `priority:p0`
Project: Submission Deliverables
Due: 2026-05-30

**Sub-issues:**
1. UI polish: mikro-interaksi, animasi, alignment (`role:design`, `role:frontend`)
2. Demo script finalisasi (`role:research`)
3. Demo video recording + editing (assignee TBD by skill)
4. Pitch deck finalization (`role:research`, semua review)
5. README finalization round 2 (`role:devops`, `needs:docs`)
6. Demo run-through internal (semua, `priority:p0`)
7. Setup demo account + data dummy representatif (`role:backend`)
8. Backup demo video recording (`priority:p1`) — fallback kalau demo live gagal

### Parent: Day 7 — Submission (31 Mei)
Labels: `phase:submission`, `priority:p0`
Project: Submission Deliverables
Due: 2026-05-31

**Sub-issues:**
1. Final review semua deliverable pagi (semua, `priority:p0`)
2. Test deploy URL di browser incognito (`role:devops`)
3. Test login akun demo + semua fitur (semua)
4. Test demo video link accessible (`role:research`)
5. Test pitch deck PDF download (`role:research`)
6. Submit ke Devpost — target 18:00 WIB (`priority:p0`)
7. Submit ke official form — target 18:00 WIB (`priority:p0`)
8. Screenshot konfirmasi submission — simpan di repo (`role:devops`, `needs:docs`)
9. Notify tim: submission DONE

## Execution Order (untuk sesi Claude baru)

1. `mcp__linear__list_teams` → cari team ID "Retas Siber Imut", buat kalau belum ada
2. `mcp__linear__create_project` × 3 (MVP Features, Infrastructure & DevOps, Submission Deliverables)
3. `mcp__linear__create_label` untuk semua label di atas (cek dulu, skip kalau exists)
4. `mcp__linear__create_cycle` → "CyberHack Sprint" 25-31 Mei
5. Loop 7 parent issue → create parent → create sub-issues dgn `parentId`
6. Print summary URL ke user

## Notes

- Assignee dikosongkan dulu — tim isi sendiri di Linear UI setelah role lock (Section 3 planning doc)
- Estimate (story points) dikosongkan — tim isi saat planning meeting
- Date format: ISO `YYYY-MM-DD` untuk Linear API
