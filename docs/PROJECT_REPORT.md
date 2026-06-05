# Controme — Laporan Proyek Menyeluruh

> **AI-Powered Colour QC & Lot Traceability Platform untuk PT Indo Aneka Atsiri (Sima Arome)**
> CyberHack 2026 · Focus Area 03 (AI for Extract & Powder QC) + FA-01 (Integrated Operations, supporting)
> Tim **Retas Siber Imut** — Aludra (UI/UX), Salsa (Concept/Pitch), Azka (AI+Frontend), Farel (Backend)
> Dokumen ini: ringkasan menyeluruh isi proyek + insight tiap section/fitur + pemetaan problem statement → fitur.

---

## 1. Ringkasan Eksekutif

**Controme** ("Control Arome") mengubah QC warna manual Sima Arome menjadi pengukuran objektif berbasis computer vision. Satu alur kerja:

> **foto sampel → ekstrak L\*a\*b\* → hitung ΔE terhadap referensi produk → putuskan PASS / REJECT → simpan record permanen (immutable) → mengalir ke dashboard PPIC & Manager.**

Keputusan **deterministik** (input sama → hasil sama), setiap record **tidak bisa diubah/dihapus** (append-only), dan seluruh riwayat satu lot bisa di-**export satu klik** untuk Certificate of Analysis (COA) dan audit buyer ekspor.

**Status:** alur QC vision live end-to-end di produksi (`https://main.dpvw4kb04hrwl.amplifyapp.com/`) — auth-gated capture, immutable lot history, role dashboards, product-reference admin, CSV/PDF export, dan "Ask AI" rail (Gemini) di Manager dashboard. Backend = Buildpad DaaS live (RBAC, audit log, runtime extensions, workflows, cron).

---

## 2. Problem Statement (kondisi As-Is Sima Arome)

Dari Problem Statement CyberHack 2026 + dokumen research tim:

| # | Pain point inti | Dampak operasional |
|---|---|---|
| P1 | **Tidak ada alat ukur warna sama sekali** di lab QC | Keputusan lolos/tidak 100% bergantung mata operator |
| P2 | Pencahayaan ruang tidak terstandar + kartu warna cetak **memudar** | Acuan tidak konsisten antar waktu |
| P3 | Dua operator bisa hasilkan **keputusan berbeda** untuk lot sama | Tidak repeatable, tidak objektif |
| P4 | **Tidak ada nilai numerik** yang tercatat | Tidak bisa dibuktikan/diaudit |
| P5 | **Tidak ada jejak audit digital** per lot | Buyer ekspor tak punya bukti konsistensi |
| P6 | **Double entry** — tulis di kertas lalu ketik ulang ke spreadsheet | Boros waktu, rawan salah |
| P7 | Status ke PPIC lewat **WhatsApp/lisan**, tidak real-time | Penjadwalan produksi terhambat |
| P8 | Status **HOLD** menahan throughput menunggu supervisor | Lini berhenti berjam-jam |
| P9 | **Key-person risk** — QC berhenti saat operator senior absen | Ketergantungan individu |
| P10 | Audit buyer butuh kumpulkan 3–4 file → **berjam-jam** | Respons lambat ke buyer |

**Focus Area 03** (primary): *"visual or sensor-based checks on extract powder for colour, consistency, contamination — flagging out-of-spec lots before they get packed and shipped."*
**Focus Area 01** (supporting): hubungkan hasil QC ke record lot + status clearance PPIC sebagai single source of truth.

---

## 3. Arsitektur Sistem

Dua-tier dari sudut pandang browser. **Browser tidak pernah memanggil DaaS atau Supabase langsung** — semua lewat Next.js route handler same-origin (no CORS leak, credential server-only).

```text
Browser ──same-origin HTTPS──> Next.js 16 App Router
                                 ├─ /api/auth/*    Supabase Auth proxy
                                 ├─ /api/qc/*      vision QC + lots (verdict recompute)
                                 ├─ /api/items/*   DaaS data proxy (generic CRUD)
                                 ├─ /api/files,assets/*  DaaS file proxy
                                 ├─ /api/export/*  COA PDF/CSV
                                 ├─ /api/chat      Ask AI (Gemini stream)
                                 ├─ /api/cron/*    DaaS cron admin proxy
                                 └─ /api/health    liveness probe
                                        │
                                        v
                              Buildpad DaaS REST API
                              (CRUD · RBAC · audit log · files · extensions · workflows · cron)
                                        │
                                        v
                              Supabase Postgres + RLS
```

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 (strict) |
| UI | Mantine v8 + Buildpad UI (copy-own di `components/ui/`) |
| Vision | `sharp` (ROI + masking server-side), `chroma-js` (sRGB→CIE Lab, ΔE) |
| AI | Vercel AI SDK + Google Gemini (`@ai-sdk/google`, `gemini-2.5-flash`) |
| Backend | Buildpad DaaS REST API |
| Database | Supabase PostgreSQL + Row Level Security |
| Auth | Supabase Auth via server-side proxy (`/api/auth/*`) |
| Tests | Vitest (unit) + Playwright (E2E) |
| Deploy | AWS Amplify (push `main` → `amplify.yml`); build dari AWS CodeCommit |

**Insight arsitektur:** pola proxy server-side adalah keputusan keamanan utama — token DaaS & service-role tidak pernah sampai ke browser, dan verdict QC selalu **dihitung ulang di server** (`/api/qc/lots`) sehingga hasil dari client tidak pernah dipercaya. Ini sekaligus menutup CORS dan menjadikan setiap mutasi tercatat di audit log DaaS otomatis.

---

## 4. Struktur Kode (peta direktori)

| Path | Isi | Insight |
|---|---|---|
| `app/(authenticated)/` | Semua halaman di balik auth; `AuthenticatedAppShell.tsx` pemilik nav shell + gating peran | Satu shell, nav di-gate `useAppRoles()` |
| `app/api/` | Route handler proxy (auth, items, qc, files, export, chat, cron, health, admin) | Satu-satunya jalan browser→backend |
| `app/poc/` | PoC vision browser-only (`/poc/vision`) + role-nav | Demo cepat tanpa auth/backend |
| `lib/vision/` | Pipeline gambar (browser + server) | Logika CV terisolasi & ter-test |
| `lib/domain/` | Business logic QC (ΔE, status, guard immutable) | Pure functions, mudah diuji |
| `lib/dashboard/` | Helper analitik dashboard (+ vitest co-located) | Murni/display, precomputed-first |
| `lib/auth/` | `useAppRoles`, `role-gating`, demo & recent accounts | Sumber kebenaran RBAC frontend |
| `lib/buildpad/` | SDK Buildpad (CLI-managed, **jangan edit manual**) | Hooks + services + types |
| `lib/api/` | Helper proxy server-side (`auth-headers`, `daas-proxy`) | JWT Supabase → Bearer DaaS |
| `lib/qc/` | Pencarian lot & produk | Util kecil ter-test |
| `lib/export/` | CSV builder | Untuk COA |
| `components/vision/` | `CameraCapture`, `ColorQcCapture` | UI capture |
| `components/dashboard/` | Widget Manager/PPIC, Ask AI, SPC, health, daily stats | Semua dashboard |
| `components/ui/` | 47 komponen Buildpad copy-own | CLI only |
| `docs/daas/` | Snapshot kode extension/cron DaaS | Reproducible backend |

---

## 5. Fitur per Section (apa + file + insight)

### 5.1 QC Capture — `/qc/capture`
- **Apa:** Operator pilih produk + stage (incoming/finish), upload/foto sampel; server hitung ulang ΔE + kontaminasi + tekstur dari foto via `sharp`. Preview browser (`lib/vision/sample-color.ts`) hanya advisory.
- **File:** `components/vision/ColorQcCapture.tsx`, `components/vision/CameraCapture.tsx`, `app/api/qc/lots/route.ts`, `lib/vision/image-pipeline.server.ts`.
- **Insight:** Verdict yang disimpan **selalu** recompute server-side (`image-pipeline.server.ts`) — client tidak dipercaya. "Grab frame" hanya muncul saat kamera live; ada tombol "Reset photo" untuk ganti foto. Session reference dihapus dari peran operator — hanya admin menentukan referensi (integritas keputusan).

### 5.2 Lot History — `/qc/lots`, `/qc/lots/[id]`
- **Apa:** Daftar immutable semua lot QC; koreksi = record baru, bukan edit. Detail lot menampilkan L\*a\*b\*, ΔE, status, per-channel delta, foto, operator, timestamp (WIB).
- **File:** `app/(authenticated)/qc/lots/page.tsx`, `app/(authenticated)/qc/lots/[id]/page.tsx`, `lib/domain/collection-guards.ts`, `lib/qc/lot-search.ts`.
- **Insight:** Urutan default terbaru dulu (`defaultSort checked_at desc`). Append-only dijaga 2 lapis — proxy guard + DaaS filter hook. Halaman detail SSR harus *degrade not throw* (fetch field-set bertingkat) supaya tahan error ekspansi relasi.

### 5.3 PPIC Dashboard — `/dashboard/ppic`
- **Apa:** Status clearance lot real-time untuk perencanaan produksi: QC-cleared / Warning band / Rejected per shift/stage.
- **File:** `app/(authenticated)/dashboard/ppic/page.tsx`, `components/dashboard/QcDashboards.tsx`, `lib/dashboard/qc-analytics.ts`.
- **Insight:** "Warning band" = lot PASS tapi mendekati ambang (watch list), bukan status ketiga. PPIC read-only — tidak bisa ubah keputusan QC.

### 5.4 Manager Dashboard — `/dashboard/manager`
- **Apa:** 4 panel — **QC Briefs & Alerts** (notifikasi), **Process Control (SPC)** (control chart Cpu/I-MR), **Analytics** (pass-rate per produk, trend ΔE, daftar lot risiko reject+warning), **Daily KPI** (rollup harian) + **Ask AI** rail (Gemini baca live `qc_lots`).
- **File:** `components/dashboard/ManagerDashboardHub.tsx`, `ManagerAiAssistant.tsx`, `SpcPanel.tsx`, `DailyStatsStrip.tsx`, `ManagerNotifications.tsx`; `lib/dashboard/{spc,qc-daily-stats,qc-analytics,manager-ai,notifications}.ts`.
- **Insight:** Dashboard baca `qc_daily_stats` (precomputed cron) lebih dulu, fallback ke live lots — scalable, tak men-scan `qc_lots` tiap render. Ask AI memberi insight bahasa natural di atas data QC nyata. **System Health bukan di sini** — dipindah ke Admin dashboard (lihat 5.9, least-privilege).

### 5.5 Product Admin — `/admin/products`, `/admin/products/[id]`
- **Apa:** Kelola referensi warna (`ref_l/a/b`, `delta_e_max`, `warning_margin`) + riwayat versi. Reference Assistant menurunkan Lab dari foto master (AI-assisted).
- **File:** `app/(authenticated)/admin/products/*`, `app/api/qc/products/[id]/update-reference/route.ts`, `components/admin/ProductReferenceAssistant.tsx`, `lib/vision/reference-assistant.ts`.
- **Insight:** Perubahan referensi **versioned** (DaaS action hook → `product_reference_versions`) — record QC lama tetap menunjuk versi referensi yang berlaku saat pengukuran, jadi mengubah referensi tidak mengubah keputusan historis.

### 5.6 Lot Export (COA) — `/api/export/lot/[id]`
- **Apa:** Export riwayat lengkap satu lot ke PDF/CSV satu klik (foto, L\*a\*b\*, ΔE, status, timestamp, operator).
- **File:** `app/api/export/lot/[id]/route.ts`, `lib/export/csv.ts`, `lib/domain/qc-export.ts`, `components/export/LotExportActions.tsx`.
- **Insight:** Menjawab langsung kebutuhan audit buyer "menit, bukan jam".

### 5.7 Auth & Account Management
- **Apa:** Login/logout/signup via proxy Supabase; admin-managed employee account creation (peran ditugaskan admin). Halaman approval untuk akun pending.
- **File:** `app/api/auth/*`, `app/api/admin/accounts/route.ts`, `lib/auth/{signup-provisioning,account-roles,role-gating}.ts`, `app/login|signup|approval/page.tsx`.
- **Insight:** Signup publik di-403; akun karyawan dibuat admin (Zod-validated, role enum mengecualikan admin, idempotent role-link + rollback). Butuh `SUPABASE_SERVICE_ROLE_KEY` + `DAAS_STATIC_TOKEN` di env Amplify.

### 5.8 Observability & Enterprise Crons (DaaS)
- **Apa:** 4 cron aktif — `qc-integrity-watch` (deteksi tamper), `qc-heartbeat` (latency+freshness→`system_health`), `qc-audit-archive` (arsip sebelum purge 90 hari), `qc-daily-stats` (rollup KPI harian) + `qc-daily-cta-brief` (ranked CTA manager). Health endpoint `GET /api/health`.
- **File:** `docs/daas/*.js`, `lib/dashboard/{system-health,qc-daily-stats}.ts`, `app/api/health/route.ts`.
- **Insight:** Logika backend hidup di DaaS runtime extension + cron, bukan dibangun ulang di Next.js — sesuai prinsip backend-first.

### 5.9 Admin Dashboard — `/dashboard/admin`
- **Apa:** Workspace admin-only — buat akun karyawan (email/password/role, Zod-validated) + **System Health** widget (heartbeat, latency backend, freshness data).
- **File:** `app/(authenticated)/dashboard/admin/page.tsx`, `components/dashboard/SystemHealthWidget.tsx`, `app/api/admin/accounts/route.ts`.
- **Insight:** **System Health hanya di sini** (bukan Manager) — monitoring platform = tanggung jawab admin, least-privilege. Manager fokus ke KPI QC, bukan kesehatan infra.

---

## 6. ⭐ Pemetaan Problem Statement → Fitur (inti permintaan)

Setiap pain point As-Is dipetakan ke Functional Requirement, fitur Controme, dan file implementasinya.

| Pain (§2) | FR (PRD) | Fitur Controme | Cara menyelesaikan | Implementasi |
|---|---|---|---|---|
| **P1** tak ada alat ukur warna | FR-01 | QC Capture + Vision pipeline | Kamera + CIELAB menggantikan mata; ΔE terukur | `lib/vision/image-pipeline.server.ts`, `lib/domain/colorimetry.ts` |
| **P2** cahaya/kartu tidak standar | FR-01 | White-balance + ROI + kalibrasi | Koreksi white-balance & ekstraksi ROI tengah sebelum analisis | `lib/vision/{white-balance,roi,sample-color}.ts` |
| **P3** keputusan beda antar operator | FR-01 | Decision rule deterministik | Aturan tunggal biner ΔE ≤ ΔEₘₐₓ → PASS, identik untuk input sama | `lib/domain/qc.ts` (CIE76, PASS/REJECT) |
| **P4** tak ada nilai numerik | FR-02 | Lot record (L\*a\*b\*, ΔE) | Simpan nilai terukur + ΔE + per-channel delta di tiap record | `app/api/qc/lots/route.ts`, schema `qc_lots` |
| **P5** tak ada audit digital | FR-02 | Immutable lot history + audit trail | Append-only 2 lapis + DaaS activity log otomatis | `lib/domain/collection-guards.ts`, `docs/daas/append-only-guards.js` |
| **P6** double entry | FR-07 | Single-entry capture | Hasil QC langsung jadi record sistem, tanpa ketik ulang | `/api/qc/lots` → `qc_lots` |
| **P7** status PPIC lewat WA | FR-04, FR-07 | PPIC Dashboard real-time | Status clearance terbaca dari sistem yang sama (single source) | `components/dashboard/QcDashboards.tsx` |
| **P8** HOLD menahan throughput | FR-01 §5.3 | Warning band (bukan status) | Lot nyaris-batas tetap PASS + warning, alur tak berhenti | `lib/domain/qc.ts` (`isWarningBand`) |
| **P9** key-person risk | FR-01 | QC mandiri | Pemeriksaan standar bisa dijalankan siapa pun kapan pun | QC Capture flow |
| **P10** audit buyer berjam-jam | FR-06 | Lot Export COA satu klik | Export PDF/CSV riwayat lot < 1 menit | `app/api/export/lot/[id]/route.ts` |
| (governance) admin atur referensi | FR-03 | Product reference versioned | Versi referensi; record lama tak berubah | `app/api/qc/products/[id]/update-reference/route.ts` |
| (governance) RBAC | FR-05 | RBAC 4 peran front+back | Policy DaaS + nav scoped | `lib/auth/role-gating.ts`, DaaS policies |

### Pemetaan Focus Area → kontribusi fitur
| Focus Area | Elemen | Fitur penjawab |
|---|---|---|
| **FA-03** (primary) colour | Cek warna objektif | QC Capture, Vision pipeline, Decision rule, Lot record |
| **FA-03** consistency/contamination | Tekstur + kontaminasi | Lane texture & contamination di `image-pipeline.server.ts` (color/contamination/consistency status) |
| **FA-01** (supporting) integrated ops | Lot ↔ PPIC single source | PPIC Dashboard, FR-07 single-entry, status clearance |

---

## 7. Model Keputusan QC (inti teknis)

- **Ruang warna:** CIELAB (CIE 1976) — mendekati persepsi mata, standar colorimetry pangan.
- **Rumus:** **ΔE₇₆ = √((ΔL\*)² + (Δa\*)² + (Δb\*)²)** — deterministik, transparan, mudah diverifikasi tangan saat demo. CIE2000 disiapkan sebagai opsi iterasi berikutnya.
- **Aturan (biner, batas inklusif):**

| Zona | Rentang ΔE | Hasil |
|---|---|---|
| Aman | ΔE ≤ 0.90 × ΔEₘₐₓ | PASS — tanpa peringatan |
| Waspada | 0.90×ΔEₘₐₓ < ΔE ≤ ΔEₘₐₓ | PASS + **warning** ke Manager |
| Gagal | ΔE > ΔEₘₐₓ | REJECT + **alert** |

- **Per-channel delta (ΔL\*, Δa\*, Δb\*):** untuk **diagnosis akar masalah**, bukan keputusan. Contoh: Ginger ΔE 6.1 dengan Δb\* negatif → warna pudar (bahan kurang segar), bukan overheat.
- **Produk seed:** Ginger (ref L 68.5 / a +7.2 / b +32.4; ΔEₘₐₓ 5.0) dan Dragon Fruit (ref L 45.0 / a +38.6 / b −8.3; ΔEₘₐₓ 4.5, lebih ketat).

**Insight:** ΔE dijadikan **gerbang keputusan tunggal** (bukan dual-gate per channel) untuk menghindari aturan yang saling kontradiktif dan selaras praktik industri (Konica Minolta, X-Rite). Toleransi per-channel = panduan diagnosis.

---

## 8. Data Model

**4 collection domain + 3 collection observability** (skema penuh: `docs/SCHEMA.md`):

| Collection | Sifat | Isi |
|---|---|---|
| `products` | mutable (admin) | referensi warna Lab, toleransi, ΔEₘₐₓ, warning_margin |
| `qc_lots` | **immutable** (create+read) | Lab terukur, ΔE, pass/reject, warning_flag, kontaminasi/konsistensi, foto, operator, stage, timestamp |
| `product_reference_versions` | **append-only** | satu baris per perubahan referensi |
| `qc_notifications` | manager-ack | alert reject / warning band (level enum `alert\|warning`) |
| `system_health` | auto-prune 7d | sampel heartbeat (latency + freshness) |
| `audit_archive` | append-only | salinan `daas_activity` sebelum purge 90 hari |
| `qc_daily_stats` | 1 baris/hari | rollup KPI precomputed |

DaaS `daas_activity` mencatat setiap mutasi otomatis — **tidak ada custom audit trail**.

---

## 9. RBAC (4 peran, front + back)

| Peran | Akses inti | Tidak boleh |
|---|---|---|
| **QC Operator** | capture lot, lihat history sendiri (`operator_id` preset `$CURRENT_USER`, tak bisa di-spoof) | ubah referensi/akun, update/delete lot |
| **PPIC** | dashboard clearance real-time (read-only) | ubah keputusan QC |
| **Manager** | dashboard eksekutif + Ask AI, export COA (read-only record) | edit record |
| **Admin** | kelola produk/referensi/akun, audit log penuh | **mengubah isi record QC** (tetap immutable) |

**Prinsip:** tidak ada peran — termasuk Admin — yang bisa mengedit/menghapus record QC setelah dibuat. Enforcement: backend (policy DaaS, 403) **dan** frontend (nav scoped `useAppRoles` + `role-gating.ts`).

---

## 10. Enterprise Readiness (rubrik CyberHack — 8 komponen)

| # | Komponen | Status | Bukti |
|---|---|---|---|
| 1 | Immutable audit trail | ✅ | DaaS activity log + append-only 2 lapis + `qc-audit-archive` + `qc-integrity-watch` |
| 2 | RBAC ≥3 peran front+back | ✅ | policy DaaS + nav scoped |
| 3 | Policy enforcement (RLS) | ✅ | Supabase RLS + `qc-lots-validate-create` + Zod boundary |
| 4 | Security | ✅📄 | HTTPS, proxy server-side, secrets env-only, verdict recompute, CORS eksplisit |
| 5 | Scalability | ✅📄 | stateless Next.js, precomputed `qc_daily_stats`, Amplify CDN |
| 6 | Observability | ✅ | `qc-heartbeat`→System Health, `/api/health`, integrity-watch, activity log |
| 7 | Clean docs | ✅ | README + ARCHITECTURE/API/SCHEMA/SECURITY/DAAS_* |
| 8 | Deployability | ✅ | CI lint+test + Amplify dari CodeCommit, staging+prod |

---

## 11. Testing & Deploy

- **Unit:** Vitest co-located (`*.test.ts`) — colorimetry, qc decision, vision pipeline, dashboard analytics, csv, guards, lot/product search. Target ≥80% coverage pada kode yang berubah.
- **E2E:** Playwright (`e2e/`) — qc-flow-auth, vision-poc (deterministik via SVG/PNG fixtures).
- **CI:** `.github/workflows/ci.yml` lint + test tiap push/PR.
- **CD:** push `main` → Amplify build (`amplify.yml`: pnpm install → `pnpm build` → `.next`). Build dari **AWS CodeCommit**; GitHub untuk PR/CI. Catatan: `pnpm build` pakai `--webpack` (sharp butuh detect-libc; Turbopack drop dep → 500 di Lambda).

---

## 12. Batasan & Pengembangan Lanjut (Out of Scope v1.0)

- Nose-test/aroma otomatis — tidak.
- Deteksi kontaminan visual non-warna penuh — v1.0 fokus warna; foto resolusi penuh disimpan untuk pemeriksaan manual + basis model v2.
- Integrasi langsung mesin Tournaire, cold-chain drum, demand forecasting, penjadwalan produksi otomatis — di luar scope.
- Akurasi kamera konsumer < colorimeter lab → "fit-for-screening", kalibrasi wajib.
- **Follow-up direkomendasikan:** index B-tree eksplisit `qc_lots.checked_at` + `qc_lots.product_id`; CIE2000 sebagai opsi; MFA di level Supabase.

---

_Dokumen pendukung: `docs/Retas Siber Imut - PRD.md`, `docs/ARCHITECTURE.md`, `docs/SCHEMA.md`, `docs/SECURITY.md`, `docs/ENTERPRISE_READINESS.md`, `docs/DAAS_EXTENSIONS.md`, `docs/DAAS_WORKFLOWS.md`, `README.md`._
