# Controme — Jury Q&A Prep

> Persiapan tanya-jawab juri CyberHack 2026. **Semua jawaban di-ground ke kode nyata**, bukan PRD
> (PRD sebagian sudah basi — lihat catatan di §2). Prinsip menjawab: **jujur + tunjukkan bukti file +
> bedakan "sudah jalan" vs "roadmap".** Lebih baik akui satu gap dengan rencana, daripada overclaim
> lalu ketahuan.
>
> Cara pakai: hafalkan **Fact Sheet (§1)** sebagai satu sumber kebenaran angka. Tiap pertanyaan
> punya: *jawaban inti* (yang diucapkan), *jujur/gap* (yang harus diakui), *jangan bilang* (jebakan
> overclaim), *bukti* (file untuk live demo / kalau juri minta tunjuk kode).

---

## 1. Fact Sheet — angka & klaim yang boleh diucapkan

| Topik | Fakta nyata | Bukti |
|---|---|---|
| Metrik warna | **CIE76 ΔE** (Euclidean Lab). Reject bila `ΔE > deltaEMax` (per-produk). ΔE = ΔEmax → PASS (inklusif) | `lib/domain/colorimetry.ts:33`, `qc.ts:99` |
| ΔE00 | **Belum diimplementasi.** Kontrak evaluasi dirancang swap-ready ke CIEDE2000 tanpa ubah pemanggil | `colorimetry.ts:26-32` |
| Verdict otoritatif | Dihitung **server-side** dari byte foto. Preview browser hanya advisory, tak pernah dipercaya | `app/api/qc/lots/route.ts:6`, `image-pipeline.server.ts:1-9` |
| Pipeline server | sharp decode → EXIF auto-rotate → resize ≤**1024px** → gray-world white-balance (full frame) → center ROI → analisis piksel → Lab → ΔE | `image-pipeline.server.ts:55-91` |
| 3 lane (semua nyata) | **color** (ΔE), **contamination** (piksel gelap relatif + blob), **consistency** (stddev kecerahan + kontras tekstur). Reject bila **ada satu** lane reject | `sample-color.ts:228`, `route.ts:103-107` |
| Sifat detektor lane | **Heuristik statistik piksel + threshold**, BUKAN model ML/terlatih, tanpa data berlabel | `sample-color.ts:228-377` |
| Threshold contamination | rasio gelap > **0.025** & ≥16px (scattered), atau blob kontigu ≥ max(24px, 0.0008×ROI) (4-konektivitas flood-fill) | `sample-color.ts:234-341` |
| Threshold consistency | brightnessStdDev > **26** atau textureContrast > **18** | `sample-color.ts:236-345` |
| Threshold scope | **ΔEmax per-produk**; threshold contamination/consistency **global default** (route panggil tanpa opts per-produk) | `route.ts:95` |
| Immutability | 3 lapis: (1) Next proxy guard, (2) DaaS item-filter hooks (6 guard), (3) audit log DaaS otomatis | `collection-guards.ts`, `daas/append-only-guards.js` |
| Batas immutability | DaaS guard hanya lindungi **items/MCP API**. Tulisan **service-role/SQL langsung** (cron, admin) sengaja tak diblok. **Tanpa** DB trigger, **tanpa** hash-chain kripto | `daas/append-only-guards.js:11-13` |
| operator_id | DaaS policy preset ke `$CURRENT_USER` → tak bisa dipalsukan walau body request bohong | `docs/ENTERPRISE_READINESS.md §2` |
| Audit trail | DaaS activity log merekam tiap mutasi (aktor, IP, waktu, before/after) otomatis; `audit_archive` salin sebelum purge 90 hari | `ENTERPRISE_READINESS.md §1` |
| AWS | Amplify (Lambda SSR/API), CloudFront CDN, CodeCommit CI/CD. **Supabase & Buildpad DaaS = pihak ketiga** (Supabase kebetulan jalan di AWS) | `amplify.yml`, `README.md` |
| Region data | **ap-southeast-1 (Singapura)** saat ini; dapat dipindah region Jakarta (ap-southeast-3) | infra |
| Latency `/api/qc/lots` | Vision sub-detik (≤1024px). End-to-end = + **4 round-trip DaaS sekuensial** (product GET, file POST, users/me GET, lot POST) + kemungkinan cold start (`maxDuration` 60s) | `route.ts:65-176` |
| Offline | **Tidak ada.** Browser wajib menjangkau Next.js→DaaS untuk merekam verdict | — |
| RBAC | 4 peran (qc_operator, ppic, manager, admin) — backend (DaaS policy, 403) + frontend (nav scoped `useAppRoles`) | `lib/auth/role-gating.ts` |
| Seed demo | 2 produk (Ginger ΔEmax 5.0, Dragon Fruit ΔEmax 4.5) | `lib/domain/reference-products.ts` |

---

## 2. Koreksi penting: PRD vs kode nyata

- **PRD §3.3 bilang "v1.0 warna saja, kontaminasi → catatan manual".** **SALAH/basi.** Kode benar-benar
  menjalankan contamination + consistency sebagai lane reject. → Saat ditanya, jawab dari **kode**:
  *"Tiga lane aktif."* Jangan mengutip PRD yang basi.
- **"Proven 500+ variants" dan "3 monetization pillars / pricing"** → **tidak ada di kode sama sekali**;
  itu materi pitch deck (domain Salsa). Tak bisa dibuktikan dari produk. Siapkan terpisah atau lunakkan
  klaim slide.

---

## 3. English soundbites (5 pertanyaan tersulit)

Untuk pitch berbahasa Inggris — kalimat pembuka singkat, lalu lanjut detail.

1. **CIE76:** *"We use CIE76 deliberately — it's deterministic and hand-auditable for a jury demo. We
   know it under-weights saturated hues; our evaluation contract is built to swap to CIEDE2000 without
   touching any caller, and that's our next step for the Dragon-Fruit-class colours."*
2. **Immutability layer:** *"Append-only is enforced at three layers — the Next.js proxy, six DaaS
   filter hooks on the items API, and the automatic DaaS audit log. We're honest that raw service-role
   SQL isn't blocked by those hooks; a database trigger and a hash-chain are our hardening roadmap. But
   every attempt is still recorded in the immutable activity log."*
3. **Server-authoritative pipeline:** *"The browser only shows an advisory preview. The stored verdict
   is always recomputed server-side from the photo bytes with sharp — decode, white-balance, ROI, Lab,
   ΔE — so a tampered client can never forge a PASS."*
4. **Offline:** *"Today, no — a verdict needs connectivity. That's a known gap; an offline-queue PWA is
   on our roadmap. For the lab environment this targets, the capture station is wired."*
5. **Generalization:** *"Colour generalisation is real and architectural — a new product is just a
   reference row (Lab + tolerances + ΔE-max). What's not automatic yet is per-industry regulatory
   compliance and per-powder contamination thresholds — those are configuration and roadmap, not a new
   build."*

---

## 4. Per-pertanyaan

### A. Mr. Dhani — IT Manager (integrasi & operasi)

**A1. Di lapis mana immutability di-enforce — DB, aplikasi, atau kriptografi? Bukankah immutability
level-aplikasi bisa di-bypass siapa pun dengan akses DB langsung?**
- **Jawaban inti:** Tiga lapis — (1) Next proxy guard menolak POST/PATCH/DELETE ke `qc_lots` &
  `product_reference_versions` lewat proxy generik; (2) enam DaaS filter hook menolak UPDATE/DELETE di
  backend; (3) DaaS audit log merekam setiap mutasi otomatis.
- **Jujur/gap:** Benar — DaaS hook hanya menjaga items/MCP API. Tulisan service-role/SQL langsung
  (dipakai cron & admin tooling) **sengaja tidak** diblok, dan **belum** ada DB trigger maupun
  hash-chain kriptografis. Tapi upaya apa pun tetap terekam di activity log yang juga append-only.
- **Roadmap:** Postgres trigger (BEFORE UPDATE/DELETE → RAISE) + hash-chain antar-record untuk bukti
  tamper-evidence kripto.
- **Jangan bilang:** "Immutable secara kriptografis" atau "tidak mungkin diubah siapa pun". Tidak benar.
- **Bukti:** `lib/domain/collection-guards.ts`, `docs/daas/append-only-guards.js`.

**A2. Kalau internet pabrik putus, operator masih bisa rekam verdict atau seluruh workflow berhenti?**
- **Jawaban inti:** Saat ini verdict butuh konektivitas — browser memanggil Next.js → DaaS. Tanpa
  jaringan, capture tak bisa disimpan.
- **Jujur/gap:** Ini gap nyata yang kami akui.
- **Roadmap:** PWA + antrian offline (IndexedDB) yang sinkron saat online; verdict tetap di-recompute
  server saat sync agar otoritatif.
- **Konteks meredam:** Target lingkungan = stasiun lab/QC ber-jaringan tetap, bukan handheld di lapangan.

**A3. Bagaimana Controme terintegrasi dengan sistem produksi/ERP existing kami?**
- **Jawaban inti:** v1 berdiri sebagai single source of truth QC; hasil QC otomatis jadi record lot
  tanpa entry ulang. DaaS mengekspos REST API untuk integrasi keluar.
- **Jujur/gap:** Belum ada konektor langsung ke MES/ERP atau mesin Tournaire (di luar scope v1).
- **Roadmap:** Webhook/REST sync ke ERP; integrasi mesin = fase berikutnya.

**A4. Perubahan infrastruktur apa yang kami butuhkan untuk go-live?**
- **Jawaban inti:** Minimal — browser modern + kamera (webcam/tablet) + rig pencahayaan sederhana
  (booth + lampu standar untuk konsistensi). Tanpa server on-prem; aplikasi serverless di AWS Amplify.
- **Bukti:** arsitektur two-tier, `README.md`.

---

### B. Mr. Baskoro — akademik/teknis (rigor)

**B1. Kenapa CIE76 (Euclidean) yang lemah untuk warna saturated & beda kecil, bukan CIE2000?
Bagaimana pengaruhnya ke reliabilitas verdict?**
- **Jawaban inti:** CIE76 dipilih agar keputusan deterministik dan bisa diverifikasi tangan saat demo
  juri. Kontrak evaluasi sudah dirancang agar bisa di-upgrade ke CIEDE2000 tanpa mengubah pemanggil.
- **Jujur/gap:** Untuk produk saturated seperti Dragon Fruit (ΔEmax 4.5), CIE76 memang kurang akurat
  perseptual — kritik valid. ΔE00 **belum** diimplementasi.
- **Roadmap/mitigasi:** Implement `deltaE2000` (hanya menyentuh `colorimetry.ts`) sebelum final agar
  pertanyaan ini netral. Threshold per-produk juga mengompensasi sebagian.
- **Jangan bilang:** "Tinggal nyalakan config" — belum ada flag config; harus diimplementasi dulu.
- **Bukti:** `lib/domain/colorimetry.ts:26-38`.

**B2. Persisnya komputasi apa di server vs client, dan berapa latency per submission QC?**
- **Jawaban inti:** Client = preview advisory (averaging RGB + Lab di `sample-color.ts`, jalan di
  browser). Server = recompute otoritatif: sharp decode → EXIF rotate → resize ≤1024 → gray-world WB
  (dari full frame agar asumsi gray-world sahih) → center ROI → analisis piksel 3 lane → Lab → ΔE.
- **Latency:** Komputasi vision sub-detik pada ≤1024px. End-to-end didominasi 4 round-trip DaaS
  sekuensial + kemungkinan cold start (function `maxDuration` 60s sebagai pengaman, bukan target).
- **TODO sebelum demo:** ukur angka nyata (lihat §6) → ganti "sub-detik/…" dengan median + p95 asli.
- **Bukti:** `lib/vision/image-pipeline.server.ts`, `app/api/qc/lots/route.ts:65-176`.

**B3. Lane kontaminasi & konsistensi — divalidasi dengan data apa? Bagaimana membedakannya dari
sekadar deviasi warna?**
- **Jawaban inti:** Ini **heuristik statistik piksel**, bukan model terlatih. Kontaminasi = piksel jauh
  lebih gelap dari mean powder (rasio global + blob kontigu via flood-fill 4-konektivitas, menangkap
  satu objek asing lokal yang luput dari rasio global). Konsistensi = stddev kecerahan + kontras
  tekstur antar-piksel tetangga. Ketiganya lane terpisah dari ΔE warna.
- **Jujur/gap:** Threshold ditetapkan & di-tuning pada fixture demo, **tanpa dataset berlabel**.
  Threshold contamination/consistency saat ini **global**, belum per-produk.
- **Roadmap:** Kalibrasi threshold per-produk; dataset berlabel → model terlatih di v2.
- **Jangan bilang:** "AI mendeteksi kontaminasi" / "deep learning". Sebut "heuristik computer-vision".
- **Bukti:** `lib/vision/sample-color.ts:228-377`.

**B4. Akurasi kamera konsumer vs colorimeter lab — bagaimana divalidasi? Siapa menetapkan Lab
referensi (ground truth)?**
- **Jawaban inti:** Akurasi dinyatakan "fit-for-screening", bukan pengganti instrumen tersertifikasi.
  White-balance gray-world mengompensasi variasi pencahayaan; rig menjaga konsistensi. Nilai Lab
  referensi ditetapkan admin/R&D dari sampel master yang disetujui (versioned).
- **Jujur/gap:** Repeatability target ΔE < 1.0 antar pengukuran lot sama; perlu validasi lapangan vs
  colorimeter untuk angka pasti.
- **Bukti:** `lib/vision/white-balance.ts`, referensi versioned `product_reference_versions`.

---

### C. Mr. Yopan — AWS Indonesia (cloud & kedaulatan data)

**C1. Service AWS apa saja, dan bagaimana failover jika cloud endpoint tak tersedia saat shift?**
- **Jawaban inti:** AWS Amplify (Lambda untuk SSR + route API), CloudFront sebagai CDN edge,
  CodeCommit untuk CI/CD. Tier data: Supabase Postgres + Buildpad DaaS.
- **Jujur/gap:** Supabase & Buildpad DaaS adalah layanan pihak ketiga (Supabase kebetulan berjalan di
  AWS), bukan AWS-native. Failover = managed oleh masing-masing platform (Lambda multi-AZ, Supabase
  HA). **Belum** ada degradasi/offline di level aplikasi bila endpoint DaaS down — workflow berhenti.
- **Roadmap:** Health-based retry/queue + offline PWA (lihat A2).
- **Jangan bilang:** "Semua di AWS" / "fully fault-tolerant".
- **Bukti:** `amplify.yml`, `docs/ENTERPRISE_READINESS.md §5-6`.

**C2. Lot record berisi data produksi sensitif — strategi data residency & kepatuhan PP 71/2019?**
- **Jawaban inti:** Data saat ini di region **ap-southeast-1 (Singapura)**; arsitektur stateless
  memudahkan pindah ke region Jakarta (ap-southeast-3) bila disyaratkan. Transport HTTPS/TLS,
  enkripsi at-rest Supabase (AES-256).
- **Jujur/gap:** PP 71/2019 untuk PSE Lingkup Privat **tidak mewajibkan** penyimpanan onshore (berbeda
  dari PP 82/2012 lama; kewajiban onshore terutama untuk PSE Lingkup Publik). Jadi posisi sekarang
  defensible, dengan jalur pindah-region bila klien meminta.
- **Jangan bilang:** "Sudah fully compliant dengan kedaulatan data Indonesia" tanpa kualifikasi —
  residency sekarang masih SG.
- **TODO:** konfirmasi region Supabase aktual sebelum demo.

---

### D. Mr. James Leong — CEO Xtremax (bisnis & produk)

**D1. Slide bilang "proven horizontal scaling 500+ variants", dibangun 6 hari — apa basis buktinya?**
- **Jawaban inti:** Yang terbukti hari ini = **arsitektur** yang dirancang untuk skala: stateless di
  Amplify (horizontal), koleksi DaaS ber-index, analitik precomputed (cron `qc-daily-stats` → dashboard
  baca rollup, bukan scan `qc_lots`). 500+ = ukuran katalog Sima Arome sebagai target; demo seed 2
  produk.
- **Jujur/gap:** "Proven 500+" tidak terbukti dalam 6 hari — sebaiknya slide berbunyi *"designed to
  scale to 500+"*. Menambah produk = menambah baris data, bukan perubahan arsitektur.
- **Bukti:** `lib/dashboard/qc-daily-stats.ts`, `components/dashboard/QcDashboards.tsx`.

**D2. Generalisasi ke F&B, Cosmetics, Pharma — mekanisme konkret atau baru roadmap?**
- **Jawaban inti:** Generalisasi **standar warna nyata & arsitektural**: produk baru = satu baris
  referensi (Lab + toleransi + ΔEmax). Model data tidak terikat satu industri.
- **Jujur/gap:** (1) Threshold contamination/consistency masih global → powder yang sangat berbeda
  butuh kalibrasi threshold; (2) kerangka regulasi tiap industri (mis. GMP farmasi) **tidak** ditangani
  = roadmap, bukan arsitektur sekarang.
- **Jangan bilang:** "Seamless ke semua industri sekarang."

**D3. Struktur pricing nyata, dan CAC vs LTV untuk klien sebesar PT IAA?**
- **Status:** **Tidak ada di kode/produk.** Ini domain pitch (Salsa). Harus disiapkan terpisah —
  jangan dijawab dari sisi teknis. Sediakan minimal: model langganan B2B + estimasi CAC/LTV walau kasar.

**D4. (lanjutan umum) ROI/payback klien, kepemilikan data & IP.**
- **Status:** Pitch/legal domain. Siapkan: penghematan waktu QC (eliminasi double-entry, export COA
  menit vs jam) sebagai dasar ROI; kepemilikan data = milik klien, hosting dipisah.

---

## 5. Danger zone — jebakan overclaim (hafalkan "jangan bilang")

| Jangan bilang | Karena | Bilang ini |
|---|---|---|
| "Immutable secara kriptografis" | Tak ada hash-chain/DB trigger | "Append-only 3 lapis + audit log; hardening kripto = roadmap" |
| "AI deteksi kontaminasi (deep learning)" | Heuristik piksel, bukan ML | "Heuristik computer-vision: blob gelap + stats tekstur" |
| "Tinggal config ke CIE2000" | Belum ada flag/implementasi | "Kontrak swap-ready; implement ΔE00 = langkah berikutnya" |
| "Semua jalan di AWS" | Supabase/DaaS pihak ketiga | "Amplify/CloudFront/Lambda AWS; data tier pihak ketiga" |
| "Fully compliant PP 71/2019" | Data masih di SG | "Defensible (PSE privat tak wajib onshore); pindah-region tersedia" |
| "Proven 500+ variants" | Demo 2 produk | "Designed to scale; arsitektur stateless + precomputed" |
| "Bisa dipakai offline" | Tak ada offline path | "Butuh konektivitas; offline-queue PWA = roadmap" |
| "v1 warna saja" (kutip PRD) | Kode jalankan 3 lane | "Tiga lane aktif: color + contamination + consistency" |

---

## 6. TODO sebelum demo (mengubah jawaban dari "kira-kira" → angka)

1. **Ukur latency `/api/qc/lots`** (untuk B2). Cara: submit foto sampel via UI/E2E, ambil dari Network
   tab atau timing log; catat **median + p95**, pisahkan warm vs cold start. Isi angkanya ke §1 & B2.
2. **(Opsional, kuat) Implement `deltaE2000`** di `lib/domain/colorimetry.ts` + flag per-produk →
   menetralkan B1 sepenuhnya.
3. **Konfirmasi region Supabase** aktual (C2).
4. **Selaraskan slide** "proven 500+" & klaim monetisasi dengan realita (D1, D3).
5. **Update PRD §3.3** agar tak lagi bilang "warna saja" (hindari kontradiksi yang bisa ditemukan juri).

---

_Sumber: kode di `lib/vision/`, `lib/domain/`, `app/api/qc/lots/route.ts`, `lib/domain/collection-guards.ts`,
`docs/daas/append-only-guards.js`, `docs/ENTERPRISE_READINESS.md`._
