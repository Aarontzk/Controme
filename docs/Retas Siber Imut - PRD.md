**PRODUCT REQUIREMENTS DOCUMENT**

**Controme**

*AI-Powered Colour QC & Lot Traceability Platform untuk Sima Arome*

| Produk | Controme — QC Vision System (Colour QC \+ Lot Traceability) |
| :---- | :---- |
| **Kompetisi** | CyberHack 2026 │ Powered by Hackpad |
| **Client** | PT. Indo Aneka Atsiri (Sima Arome), Pandaan, Jawa Timur |
| **Focus Area** | 03 — AI for Extract & Powder QC (primary) \+ 01 Integrated Operations (supporting) |
| **Versi Dokumen** | v2.0 — Model keputusan biner PASS / REJECT |
| **Tanggal** | 28 Mei 2026 |
| **Status** | Draft — In Review |
| **Cakupan** | PRD lengkap: scope, decision model, FR, NFR, data model, user story, acceptance criteria |
| **Tim** | Azka (AI \+ Frontend), Farel (Backend), Salsa (Concept \+ Pitch), Aludra (UI/UX) |

| Catatan versi v2.0 Perubahan kunci: model status QC disederhanakan menjadi dua keadaan akhir — PASS dan REJECT. Kategori HOLD pada proses manual lama tidak lagi digunakan sebagai status. Lot yang berada di dekat ambang batas tetap di-flag, tetapi melalui mekanisme notifikasi (warning), bukan status ketiga. Logika lengkap ada di Bagian 5\. |
| :---- |

**Daftar Isi**

[**1\. Executive Summary	3**](#heading=)

[1.1 Ringkasan Nilai	3](#heading=)

[**2\. Tujuan Produk	3**](#heading=)

[2.1 Tujuan Bisnis	3](#heading=)

[2.2 Tujuan Produk yang Terukur (Success Metrics)	3](#heading=)

[**3\. Scope Produk	4**](#heading=)

[3.1 Focus Area	4](#heading=)

[3.2 In Scope (v1.0)	4](#heading=)

[3.3 Out of Scope (v1.0)	5](#heading=)

[**4\. Pengguna & Hak Akses (RBAC)	5**](#heading=)

[**5\. Model Keputusan QC: PASS / REJECT	7**](#heading=)

[5.1 Glosarium Istilah	7](#heading=)

[5.2 Rumus ΔE	7](#heading=)

[5.3 Aturan Keputusan (Decision Rule)	7](#heading=)

[Warning band (pengganti fungsi flag, bukan status)	7](#heading=)

[5.4 Spesifikasi Warna Referensi per Produk	8](#heading=)

[Produk A — Spray-Dried Ginger Powder (Zingiber officinale)	8](#heading=)

[Produk B — Dragon Fruit Powder (Hylocereus spp.)	8](#heading=)

[5.5 Peran Per-Channel Delta: Diagnosis, Bukan Keputusan	9](#heading=)

[5.6 Contoh Perhitungan (Worked Examples)	9](#heading=)

[**6\. Functional Requirements	10**](#heading=)

[FR-01: Colour QC via Camera   \[Must\]	10](#heading=)

[FR-02: Lot Record & Audit Trail (Immutable)   \[Must\]	10](#heading=)

[FR-03: Product Reference Management   \[Must\]	10](#heading=)

[FR-04: Dashboard & Notifikasi   \[Must\]	10](#heading=)

[FR-05: RBAC & Manajemen Pengguna   \[Must\]	11](#heading=)

[FR-06: Export COA & Audit   \[Must\]	11](#heading=)

[FR-07: Integrasi Lot & PPIC (Supporting — FA-01)   \[Should\]	11](#heading=)

[**7\. Non-Functional Requirements	11**](#heading=)

[**8\. Data Model	11**](#heading=)

[8.1 Entitas qc\_record (immutable)	11](#heading=)

[8.2 Entitas product & product\_reference	12](#heading=)

[**9\. User Stories Prioritas Tinggi	13**](#heading=)

[9.1 Epic: QC Colour Check	13](#heading=)

[9.2 Epic: Lot Traceability	13](#heading=)

[9.3 Epic: Governance & Trust	13](#heading=)

[**10\. Alur Kerja To-Be (Controme)	13**](#heading=)

[**11\. Asumsi, Batasan & Dependensi	13**](#heading=)

[11.1 Asumsi	13](#heading=)

[11.2 Batasan (Constraints)	14](#heading=)

[11.3 Dependensi	14](#heading=)

[**Referensi	14**](#heading=)

# **1\. Executive Summary**

**Controme** (Control Arome) adalah platform Quality Control berbasis computer vision yang dirancang khusus untuk lini produksi natural extract dan spray-dried powder Sima Arome. Sistem ini menggantikan pemeriksaan warna visual manual yang saat ini 100% bergantung pada mata operator dengan pengukuran warna objektif berbasis ruang warna CIELAB, terdokumentasi otomatis, dan terhubung ke alur kerja lot serta PPIC.

Saat ini di lab QC Sima Arome **tidak ada alat ukur warna sama sekali**. Setiap keputusan lolos/tidak lolos bergantung pada (1) pengalaman operator, (2) pencahayaan ruangan yang tidak terstandar, dan (3) kartu referensi warna cetak yang dapat pudar seiring waktu. Akibatnya dua operator dapat menghasilkan keputusan berbeda untuk lot yang sama, tidak ada nilai numerik yang tercatat, dan tidak ada jejak audit digital per lot.

Controme menjawab masalah ini dengan satu alur: **foto sampel → hitung L\*a\*b\* → hitung ΔE terhadap referensi produk → putuskan PASS atau REJECT → simpan record permanen.** Hasil keputusan bersifat deterministik (aturan yang sama untuk input yang sama), setiap record bersifat immutable, dan seluruh riwayat satu lot dapat diekspor dalam satu klik untuk kebutuhan Certificate of Analysis (COA) dan audit buyer ekspor.

## **1.1 Ringkasan Nilai**

| Proposisi | Deskripsi | Metrik Target |
| :---: | ----- | ----- |
| Konsistensi objektif | Kamera \+ pengukuran CIELAB menggantikan penilaian mata; keputusan repeatable per lot, bukan per operator | Variansi ΔE \< 1.0 antar pengukuran lot yang sama |
| Audit trail otomatis | Setiap cek QC menghasilkan record digital permanen: timestamp, foto, L\*a\*b\*, ΔE, status | 100% lot ter-record tanpa input manual tambahan |
| Zero double-entry | Hasil QC langsung masuk sistem lot; tidak ada lagi tulis di kertas lalu ketik ulang ke spreadsheet | Eliminasi \> 80% waktu entry manual QC |
| Throughput mandiri | Pemeriksaan standar dapat dijalankan kapan pun, tidak bergantung pada satu operator senior | QC tidak terhenti saat 1 staf absen |

# **2\. Tujuan Produk**

## **2.1 Tujuan Bisnis**

* Menyediakan pengecekan warna powder dan ekstrak yang objektif dan konsisten, terlepas dari ketersediaan atau keahlian operator QC.

* Menghasilkan audit trail digital penuh per lot, dari QC incoming hingga dispatch, sebagai bukti konsistensi kualitas untuk buyer ekspor.

* Mengeliminasi double data entry antara form QC kertas dan sistem lot/PPIC.

* Memberikan visibilitas real-time kepada PPIC dan manager tentang status clearance bahan baku dan finished goods.

* Mengurangi ketergantungan operasional pada pengetahuan individu (key-person risk).

## **2.2 Tujuan Produk yang Terukur (Success Metrics)**

Tujuan di atas diterjemahkan menjadi metrik yang dapat diverifikasi pada saat demo dan setelah deployment:

| Tujuan | Indikator Keberhasilan | Target |
| ----- | ----- | ----- |
| Keputusan QC objektif | Selisih keputusan antar operator untuk lot identik | 0 perbedaan (deterministik) |
| Kecepatan pemeriksaan | Waktu dari capture foto hingga status muncul | \< 5 detik per sampel |
| Eliminasi entry ganda | Persentase record QC yang masih perlu input manual ke sistem lain | 0% (single entry) |
| Traceability | Waktu menyusun riwayat lengkap satu lot untuk audit buyer | Dari hitungan jam → \< 1 menit |
| Kelengkapan audit | Persentase lot dengan record QC digital lengkap | 100% |

| Sumber vs. inferensi Dinyatakan di research/problem statement: tujuan bisnis (2.1) dan masalah inti diambil langsung dari dokumen research dan Problem Statement CyberHack 2026\. Inferensi tim: angka target pada tabel 2.2 (mis. \< 5 detik, \< 1 menit) ditetapkan sebagai sasaran desain yang realistis dan dapat didemonstrasikan; ini adalah komitmen produk, bukan kutipan dari client. |
| :---- |

# **3\. Scope Produk**

## **3.1 Focus Area**

Berdasarkan Problem Statement CyberHack 2026, Controme berfokus pada **Focus Area 03 \- AI for Extract & Powder QC:** “visual or sensor-based checks on extract powder for colour, consistency, contamination — flagging out-of-spec lots before they get packed and shipped to customers.”

Elemen dari **Focus Area 01 (Integrated Operations)** disertakan sebagai **supporting feature**: koneksi hasil QC ke record lot dan status clearance PPIC, sehingga hasil pemeriksaan langsung menjadi sumber kebenaran tunggal lintas departemen.

## **3.2 In Scope (v1.0)**

| Area | Cakupan |
| :---- | :---- |
| Colour QC | Capture foto sampel via kamera terstandar, kalibrasi terhadap kartu warna acuan, perhitungan L\*a\*b\*, perhitungan ΔE terhadap referensi produk, keputusan PASS / REJECT otomatis. |
| Lot record | Pembuatan record QC immutable per pemeriksaan; satu lot dapat memiliki record di tahap QC Incoming dan QC Finish. |
| Reference mgmt | Pendaftaran produk dengan nilai L\*a\*b\* referensi \+ threshold ΔE, beserta versi/riwayat perubahan referensi. |
| Dashboard | Status clearance lot real-time untuk PPIC; metrik pass rate, trend warna, dan daftar lot REJECT untuk Manager. |
| Notifikasi | Alert saat ada lot REJECT, dan warning saat ΔE mendekati ambang (lot lolos namun berisiko). |
| Export & audit | Ekspor riwayat lot ke PDF/CSV untuk COA dan buyer audit; log seluruh aksi pengguna. |
| RBAC | Akses berbasis peran: Admin, QC Operator, PPIC, Manager. |

## **3.3 Out of Scope (v1.0)**

* Pengecekan aroma / nose-test otomatis.

* Deteksi tekstur, gumpalan, ukuran partikel, dan kontaminan visual non-warna secara otomatis (v1.0 fokus pada warna; field catatan manual disediakan).

* Integrasi langsung ke mesin produksi Tournaire (Rectification, Distillation, Extraction, Spray Dryer).

* Cold-chain monitoring suhu drum (–4 s/d –20°C) masuk Focus Area 04 pada iterasi berikutnya.

* Forecasting demand / inventory planning.

* Penjadwalan produksi otomatis (Controme menyediakan status clearance; keputusan jadwal tetap di PPIC).

| Mengapa kontaminasi visual di-defer ke catatan manual? Problem Statement menyebut “colour, consistency, contamination”. Untuk v1.0, warna dipilih sebagai metrik yang dapat diukur objektif dan dipertanggungjawabkan dengan ΔE. Deteksi kontaminasi visual otomatis (mis. bintik asing) memerlukan model deteksi objek terpisah yang tidak realistis dibangun andal dalam jendela lomba. v1.0 tetap menangkap foto resolusi penuh per lot, sehingga indikasi kontaminan dapat diperiksa manual dan dijadikan dasar model otomatis di v2. |
| :---- |

# **4\. Pengguna & Hak Akses (RBAC)**

Empat peran pengguna diturunkan langsung dari persona operasional Sima Arome (lihat dokumen Research, Bagian 2.2). Setiap peran memiliki batas akses yang tegas — ini menjadi dasar kontrol RBAC pada NFR keamanan.

| Peran | Persona acuan | Hak akses inti |
| :---- | :---- | :---- |
| QC Operator | Rudi, 28 — Operator QC | Capture sampel, jalankan pemeriksaan warna, lihat hasil PASS/REJECT, tambahkan catatan. Tidak dapat mengubah referensi produk atau menghapus record. |
| PPIC | Anita, 34 — PPIC Supervisor | Lihat dashboard clearance lot real-time, lihat riwayat lot. Read-only terhadap hasil QC; tidak dapat mengubah keputusan. |
| Manager | Sinta, 45 — QC & Ops Manager | Lihat dashboard eksekutif (pass rate, trend, lot REJECT), ekspor COA/audit satu klik. Read-only terhadap record. |
| Admin | (peran sistem) | Kelola produk & referensi L\*a\*b\*/threshold, kelola akun pengguna & peran, lihat audit log penuh. Tidak dapat mengubah isi record QC yang sudah dibuat. |

| Prinsip desain RBAC Tidak ada peran yang dapat mengedit atau menghapus record QC setelah dibuat — termasuk Admin. Ini menjaga integritas audit trail (lihat FR-02 dan NFR Auditability). Admin hanya mengatur konfigurasi (produk, referensi, akun), bukan data hasil pemeriksaan. |
| :---- |

# **5\. Model Keputusan QC: PASS / REJECT**

Ini adalah inti teknis Controme. Bagian ini mendefinisikan secara presisi bagaimana sistem memutuskan satu lot **PASS** atau **REJECT**, sehingga keputusan dapat diaudit, diuji ulang, dan dipertanggungjawabkan ke buyer.

## **5.1 Glosarium Istilah**

| Istilah | Definisi |
| :---- | :---- |
| **CIELAB (L\*a\*b\*)** | Ruang warna standar CIE 1976 yang merepresentasikan warna dalam tiga sumbu: L\* (lightness, 0 hitam – 100 putih), a\* (hijau–merah, negatif hijau / positif merah), b\* (biru–kuning, negatif biru / positif kuning). Dipilih karera mendekati persepsi mata manusia dan menjadi standar industri colorimetry pangan. |
| **Nilai referensi** | Nilai L\*a\*b\* “ideal” untuk satu produk, ditetapkan Admin/R\&D dari sampel master yang disetujui. Menjadi titik acuan pembanding. |
| **ΔE (Delta E)** | Jarak warna total antara sampel dan referensi di ruang CIELAB. Semakin kecil ΔE, semakin mirip warnanya. ΔE adalah metrik keputusan utama. |
| **Threshold ΔE (ΔEₘₐₓ)** | Batas ΔE yang masih dapat diterima untuk satu produk. Ditetapkan per produk (produk sensitif memakai threshold lebih ketat). |
| **Per-channel delta** | Selisih masing-masing sumbu (ΔL\*, Δa\*, Δb\*) antara sampel dan referensi. Dipakai untuk diagnosis akar penyebab, bukan untuk keputusan. |
| **Warning band** | Zona ΔE yang mendekati threshold (namun masih di bawahnya). Lot tetap PASS, tetapi memicu notifikasi peringatan. |

## **5.2 Rumus ΔE**

Controme v1.0 menggunakan **CIE76** sebagai rumus ΔE baseline karena sederhana, deterministik, dan transparan untuk dijelaskan ke juri serta diaudit:

**ΔE₇₆ \= √( (ΔL\*)² \+ (Δa\*)² \+ (Δb\*)² )**

dengan ΔL\* \= L\*ₛₐₘₚₗₑₙ − L\*ᵣₑₔ, dan seterusnya untuk a\* dan b\*. Sebagai catatan, **CIE2000 (ΔE₀₀)** lebih akurat secara perseptual dan disiapkan sebagai opsi konfigurasi untuk iterasi berikutnya; v1.0 memakai CIE76 agar keputusan mudah diverifikasi tangan saat demo.

## **5.3 Aturan Keputusan (Decision Rule)**

**Aturan tunggal, deterministik, biner.** Untuk setiap pemeriksaan, sistem menghitung ΔE sampel terhadap referensi produk, lalu:

| Kondisi | Status | Aksi sistem |
| :---- | ----- | :---- |
| **ΔE ≤ ΔEₘₐₓ** | **PASS** | Lot dinyatakan lolos. Record dibuat. Status clearance lot di-update ke “QC-cleared” untuk PPIC. |
| **ΔE \> ΔEₘₐₓ** | **REJECT** | Lot dinyatakan tidak lolos. Record dibuat. Notifikasi REJECT dikirim ke Manager & PPIC. Lot tidak boleh lanjut ke packaging. |

**Batas inklusif:** nilai tepat di ambang (**ΔE \= ΔEₘₐₓ**) dihitung sebagai **PASS**. Definisi ini eksplisit agar tidak ada ambiguitas “pas di batas”.

### **Warning band (pengganti fungsi flag, bukan status)**

Pada proses manual lama, lot meragukan diberi status **HOLD**. Status itu **dihapus** di Controme. Namun kemampuan menandai lot “nyaris gagal” tetap berharga. Maka diperkenalkan **warning band**: jika ΔE lolos tetapi sudah mendekati threshold, lot tetap **PASS** namun memicu notifikasi peringatan ke Manager.

**Warning jika  0.90 × ΔEₘₐₓ  \<  ΔE  ≤  ΔEₘₐₓ**

| Zona | Rentang ΔE | Hasil |
| :---- | :---- | :---- |
| Aman | ΔE ≤ 0.90 × ΔEₘₐₓ | PASS — tanpa peringatan |
| Waspada | 0.90×ΔEₘₐₓ \< ΔE ≤ ΔEₘₐₓ | PASS \+ warning ke Manager |
| Gagal | ΔE \> ΔEₘₐₓ | REJECT \+ alert |

| Keputusan desain (eksplisit) Dinyatakan oleh user: hanya gunakan PASS & REJECT; HOLD tidak dipakai. Inferensi tim: ambang warning 0.90×threshold adalah default yang dapat dikonfigurasi per produk; margin 10% adalah pilihan konservatif tim, bukan standar baku. Warning tidak mengubah status PASS, sehingga model keputusan tetap biner sesuai permintaan. |
| :---- |

## **5.4 Spesifikasi Warna Referensi per Produk**

Dua produk demo dipilih untuk prototype. Nilai L\*a\*b\* dan threshold ΔE berikut menjadi seed database (lihat juga Bagian 8 Data Model).

### **Produk A — Spray-Dried Ginger Powder (Zingiber officinale)**

**Aplikasi:** F\&B (minuman jahe, supplement), farmasi. **Karakteristik warna:** kuning kecoklatan hangat — indikator kesegaran dan kandungan gingerol. **Risiko:** terlalu gelap \= proses terlalu panas; pudar \= bahan baku kurang segar.

| Parameter | Referensi | Toleransi ± | Interpretasi diagnostik bila menyimpang |
| :---- | :---- | :---- | :---- |
| L\* (lightness) | 68.5 | 4.0 | L\* \< 64.5 terlalu gelap (overheat) • \> 72.5 terlalu pucat |
| a\* (red–green) | \+7.2 | 2.0 | a\* \< 5.2 terlalu hijau/pucat • \> 9.2 terlalu merah |
| b\* (yellow–blue) | \+32.4 | 3.5 | b\* \< 28.9 warna pudar (bahan kurang segar) • \> 35.9 |
| RGB approx. | R:212 G:164 B:67 | — | Hanya untuk preview visual di UI |
| **ΔEₘₐₓ** | **5.0** | — | **REJECT bila ΔE \> 5.0** |

### **Produk B — Dragon Fruit Powder (Hylocereus spp.)**

**Aplikasi:** natural colorant & flavoring — minuman, dairy, kosmetik. **Karakteristik warna:** merah-pink cerah saturasi tinggi — indikator betasianin. **Risiko:** sangat sensitif terhadap oksidasi dan panas; perubahan warnanya dramatis — ideal untuk demo lot REJECT.

| Parameter | Referensi | Toleransi ± | Interpretasi diagnostik bila menyimpang |
| :---- | :---- | :---- | :---- |
| L\* (lightness) | 45.0 | 3.5 | L\* \< 41.5 terlalu gelap • \> 48.5 terlalu terang |
| a\* (red–green) | \+38.6 | 4.0 | a\* \< 34.6 kurang merah (oksidasi) • \> 42.6 |
| b\* (yellow–blue) | –8.3 | 2.5 | b\* \< –10.8 atau \> –5.8 shift ke biru |
| RGB approx. | R:196 G:74 B:122 | — | Hanya untuk preview visual di UI |
| **ΔEₘₐₓ** | **4.5** | — | **REJECT bila ΔE \> 4.5 (lebih ketat — produk sensitif)** |

## **5.5 Peran Per-Channel Delta: Diagnosis, Bukan Keputusan**

Keputusan PASS/REJECT **ditentukan oleh ΔE saja**. Nilai ΔL\*, Δa\*, Δb\* dihitung dan ditampilkan untuk satu tujuan: **menjelaskan kepada operator mengapa** sebuah lot menyimpang, sehingga dapat ditindaklanjuti ke proses produksi. Contoh: lot Ginger ber-ΔE 6.1 (REJECT) dengan Δb\* \= –4.0 memberi tahu operator bahwa masalahnya adalah warna pudar — indikasi bahan baku kurang segar, bukan overheat.

| Mengapa ΔE sebagai gerbang tunggal, bukan dual-gate per channel? Pada riset, tiap channel punya kolom toleransi. Secara teknis, dual-gate (semua channel harus dalam toleransi DAN ΔE ≤ threshold) bisa kontradiktif: sebuah lot dapat lolos ΔE namun satu channel sedikit di luar toleransi. Untuk menghindari aturan yang saling bertentangan dan agar selaras dengan praktik colorimetry pangan (Konica Minolta, X-Rite memakai ΔE sebagai metrik penerimaan), Controme menetapkan ΔE sebagai satu-satunya gerbang keputusan, dan toleransi per-channel sebagai panduan diagnosis. Ini keputusan tim yang didokumentasikan, bukan kutipan dari client. |
| :---- |

## **5.6 Contoh Perhitungan (Worked Examples)**

Tiga contoh pada produk Dragon Fruit (referensi L\* 45.0, a\* \+38.6, b\* –8.3; ΔEₘₐₓ 4.5; warning \> 4.05):

| Lot | Ukur (L\*, a\*, b\*) | ΔE₇₆ | Status | Catatan diagnostik |
| ----- | :---- | ----- | ----- | :---- |
| LOT-001 | 44.6 , 39.1 , –8.0 | 0.71 | **PASS** | Dalam zona aman |
| LOT-002 | 42.3 , 36.3 , –6.0 | 4.23 | **PASS** | Warning: a\* turun (mulai oksidasi) |
| LOT-003 | 47.5 , 33.0 , –4.1 | 7.43 | **REJECT** | a\* jatuh & b\* shift biru: oksidasi berat |

Perhitungan LOT-003: ΔL\* \= \+2.5, Δa\* \= −5.6, Δb\* \= \+4.2 → ΔE \= √(2.5² \+ 5.6² \+ 4.2²) \= √(6.25 \+ 31.36 \+ 17.64) \= √55.25 \= **7.43**. Karena 7.43 \> 4.5, lot ini REJECT. Δa\* paling besar → akar masalah: penurunan kemerahan akibat oksidasi.

# **6\. Functional Requirements**

Setiap requirement diberi ID, prioritas (MoSCoW), deskripsi, dan acceptance criteria yang dapat diuji.

## **FR-01: Colour QC via Camera**   \[Must\]

* Operator memilih produk, lalu mengambil foto sampel powder/ekstrak melalui kamera pada rig/wadah terstandar dengan pencahayaan konsisten.

* Sistem mengoreksi warna foto menggunakan referensi kalibrasi (color chart) sebelum analisis.

* Sistem menghitung nilai L\*, a\*, b\* dari region of interest sampel.

* Sistem menghitung ΔE (CIE76) terhadap nilai referensi produk.

* **Sistem menampilkan status PASS atau REJECT secara otomatis** sesuai aturan Bagian 5, beserta nilai ΔE, per-channel delta, dan zona (aman/waspada/gagal).

***Acceptance criteria:***

1. Diberi sampel referensi master, ΔE hasil ukur \< 1.0 (repeatable).

2. Status muncul \< 5 detik setelah capture (lihat NFR Performance).

3. Untuk ΔE \= ΔEₘₐₓ tepat, sistem menampilkan PASS.

4. Untuk ΔE di warning band, status PASS dan indikator waspada muncul.

## **FR-02: Lot Record & Audit Trail (Immutable)**   \[Must\]

* Setiap pemeriksaan menghasilkan record berisi: **lot\_id, product\_id, qc\_stage (incoming/finish), timestamp, operator\_id, L\*, a\*, b\*, ΔE, status (pass/reject), warning\_flag, photo\_url, dan catatan opsional.**

* **Record bersifat immutable** — tidak dapat diedit atau dihapus oleh peran mana pun setelah dibuat. Koreksi dilakukan dengan membuat record baru yang merujuk record lama (append-only).

* Setiap aksi pengguna (login, capture, ekspor, perubahan referensi) tercatat di audit log terpisah.

***Acceptance criteria:***

5. Percobaan UPDATE/DELETE pada record QC ditolak di level API dan database.

6. Setiap record memiliki referensi foto yang tersimpan permanen.

7. Audit log mencatat aktor, aksi, dan waktu untuk setiap operasi sensitif.

## **FR-03: Product Reference Management**   \[Must\]

* Admin mendaftarkan produk baru dengan nilai L\*a\*b\* referensi dan threshold ΔE.

* Admin dapat menyetel margin warning band per produk (default 10%).

* **Referensi bersifat versioned**: perubahan menyimpan versi baru beserta timestamp dan aktor; record QC lama tetap menunjuk versi referensi yang berlaku saat pemeriksaan.

***Acceptance criteria:***

8. Mengubah referensi tidak mengubah hasil keputusan record QC yang sudah ada.

9. Riwayat versi referensi dapat dilihat per produk.

## **FR-04: Dashboard & Notifikasi**   \[Must\]

* Dashboard PPIC: status clearance lot real-time (pending QC / QC-cleared / rejected).

* Dashboard Manager: QC pass rate per produk, trend warna (ΔE dari waktu ke waktu), daftar lot REJECT dan lot warning.

* Notifikasi: **alert** saat ada lot REJECT; **warning** saat lot PASS namun ΔE masuk warning band.

***Acceptance criteria:***

10. Status clearance ter-update \< 5 detik setelah keputusan QC dibuat.

11. Lot REJECT memunculkan notifikasi ke Manager dan PPIC.

## **FR-05: RBAC & Manajemen Pengguna**   \[Must\]

* Empat peran: Admin, QC Operator, PPIC, Manager (lihat Bagian 4).

* Setiap endpoint memvalidasi peran sebelum mengeksekusi aksi.

***Acceptance criteria:***

12. QC Operator tidak dapat mengakses manajemen referensi atau akun.

13. PPIC dan Manager bersifat read-only terhadap record QC.

## **FR-06: Export COA & Audit**   \[Must\]

* Manager/Admin dapat mengekspor riwayat lengkap satu lot (QC incoming → finish) ke PDF dan CSV dalam satu klik.

* Ekspor mencakup foto, nilai L\*a\*b\*, ΔE, status, timestamp, dan operator.

***Acceptance criteria:***

14. Ekspor satu lot selesai \< 1 menit.

15. File ekspor berisi seluruh record terkait lot tanpa kehilangan data.

## **FR-07: Integrasi Lot & PPIC (Supporting — FA-01)**   \[Should\]

* Hasil QC otomatis memperbarui status lot tanpa entry ulang manual.

* PPIC membaca status clearance dari sistem yang sama (single source of truth).

***Acceptance criteria:***

16. Tidak ada langkah ketik ulang manual antara QC dan sistem lot.

# **7\. Non-Functional Requirements**

Dirancang selaras dengan kriteria penilaian **Enterprise Readiness (30%)** CyberHack 2026: audit trail, RBAC, keamanan, skalabilitas, dokumentasi.

| Kategori | Requirement | Target |
| :---- | :---- | :---- |
| Performance | Waktu analisis warna per sampel (capture → status) | \< 5 detik |
| Availability | Uptime sistem selama jam operasional | \> 99% |
| Security | Akses berbasis peran (RBAC) | Admin, QC Operator, PPIC, Manager |
| Security | Enkripsi data saat transit | HTTPS/TLS |
| Auditability | Retensi log seluruh aksi pengguna | ≥ 2 tahun |
| Integrity | Record QC immutable (append-only) | UPDATE/DELETE ditolak |
| Usability | Onboarding operator baru | \< 30 menit training |
| Scalability | Jumlah varian produk yang didukung | \> 500 varian |
| Reproducibility | Keputusan deterministik untuk input sama | 0 variasi hasil |
| Portability | Akses via web (desktop \+ tablet lab) | Browser modern |

# **8\. Data Model**

## **8.1 Entitas qc\_record (immutable)**

| Field | Tipe | Keterangan |
| :---- | :---- | :---- |
| record\_id | UUID | Primary key |
| lot\_id | string | Identitas lot |
| product\_id | FK | Mengacu ke product |
| reference\_version | int | Versi referensi yang berlaku saat ukur |
| qc\_stage | enum | incoming | finish |
| timestamp | datetime | Waktu pemeriksaan (UTC) |
| operator\_id | FK | Aktor yang menjalankan |
| l\_value, a\_value, b\_value | float | Hasil ukur CIELAB |
| delta\_e | float | ΔE terhadap referensi |
| status | enum | pass | reject |
| warning\_flag | boolean | true bila ΔE di warning band |
| photo\_url | string | Lokasi foto sampel |
| note | text | Catatan manual opsional (mis. indikasi kontaminan) |

## **8.2 Entitas product & product\_reference**

| Field | Tipe | Keterangan |
| :---- | :---- | :---- |
| product\_id | UUID | Primary key |
| name | string | Nama produk (mis. Spray-Dried Ginger Powder) |
| ref\_l, ref\_a, ref\_b | float | Nilai referensi CIELAB |
| delta\_e\_max | float | Threshold ΔE |
| warning\_margin | float | Default 0.10 (10%) |
| version | int | Versi referensi |
| updated\_by, updated\_at | FK, datetime | Jejak perubahan referensi |

## 

| Seed data demo (untuk Farel) Seed 2 produk (Ginger ΔEₘₐₓ 5.0; Dragon Fruit ΔEₘₐₓ 4.5). Buat minimal 2 lot PASS dan 1 lot REJECT per produk. Dragon Fruit diprioritaskan sebagai demo lot REJECT karena perubahan warnanya dramatis dan mudah dijelaskan ke juri non-teknis. |
| :---- |

# **9\. User Stories Prioritas Tinggi**

## **9.1 Epic: QC Colour Check**

* **Sebagai Operator QC,** saya ingin foto sampel powder dan langsung dapat hasil PASS/REJECT, agar saya tidak perlu membandingkan visual dengan standar cetak yang bisa pudar.

* **Sebagai Operator QC,** saya ingin hasil tersimpan otomatis ke sistem tanpa entry ulang, agar waktu kerja lebih efisien.

* **Sebagai Operator QC,** saya ingin tahu channel mana yang menyimpang saat REJECT, agar saya bisa menjelaskan akar masalah ke produksi.

## **9.2 Epic: Lot Traceability**

* **Sebagai Manager,** saya ingin export riwayat lengkap satu lot dalam satu klik, agar bisa merespons buyer dalam menit, bukan jam.

* **Sebagai PPIC,** saya ingin dashboard real-time bahan baku yang QC-cleared, agar bisa langsung menjadwalkan produksi tanpa WA operator.

## **9.3 Epic: Governance & Trust**

* **Sebagai Manager,** saya ingin record QC tidak bisa diubah siapa pun, agar audit trail dapat dipercaya buyer internasional.

* **Sebagai Admin,** saya ingin mengubah referensi produk tanpa merusak record lama, agar histori tetap akurat.

# **10\. Alur Kerja To-Be (Controme)**

Perbandingan ringkas titik friction utama saat ini versus setelah Controme:

| Tahap | Saat ini (As-Is) | Dengan Controme (To-Be) |
| :---- | :---- | :---- |
| Cek warna QC | 100% visual, beda antar operator/shift, kartu cetak bisa pudar | Foto → L\*a\*b\* → ΔE → PASS/REJECT objektif |
| Pencatatan | Form kertas lalu entry ulang ke spreadsheet (double entry) | Record digital otomatis, single entry |
| Status ke PPIC | WhatsApp / lisan, tidak real-time | Dashboard clearance real-time |
| Audit buyer | Kumpulkan 3–4 file, berjam-jam | Export satu klik \< 1 menit |
| Lot meragukan | Status HOLD menunggu supervisor (throughput terhenti) | PASS/REJECT otomatis \+ warning untuk lot nyaris-batas |

**Catatan penghapusan HOLD:** pada As-Is, lot meragukan menunggu keputusan supervisor dan bisa menahan throughput berjam-jam. Controme menghilangkan kebuntuan ini: keputusan dibuat otomatis dan deterministik berdasarkan ΔE, sementara lot nyaris-batas tetap ditandai lewat warning agar tetap mendapat perhatian manusia tanpa menahan alur.

# **11\. Asumsi, Batasan & Dependensi**

## **11.1 Asumsi**

* Pencahayaan capture dapat dijaga konsisten melalui rig/booth sederhana (kotak dengan lampu standar).

* Nilai L\*a\*b\* referensi awal disediakan dari sampel master yang disetujui R\&D.

* Kamera (webcam/tablet) cukup untuk demo; kalibrasi color chart mengompensasi variasi perangkat.

## **11.2 Batasan (Constraints)**

* Akurasi warna dari kamera konsumer \< colorimeter lab; kalibrasi wajib dan akurasi dinyatakan sebagai “fit-for-screening”, bukan pengganti instrumen tersertifikasi.

* v1.0 menilai warna, bukan tekstur/partikel/kontaminan otomatis.

* Jendela pengembangan lomba terbatas (deadline 31 Mei 2026, 23:59 WIB).

## **11.3 Dependensi**

* Backend menyediakan API perhitungan ΔE dan penyimpanan record immutable (Farel).

* Frontend \+ integrasi AI/CV untuk ekstraksi L\*a\*b\* (Azka).

* Desain UI/UX dashboard dan alur capture (Aludra).

* Narasi problem-solution fit dan pitch (Salsa).

| Catatan bahasa & submission Dokumen ini disusun dalam Bahasa Indonesia mengikuti dokumen research dan PRD acuan tim (dokumen kerja internal). Artefak submission CyberHack 2026 yang wajib berbahasa Inggris adalah demo video, pitch deck, dan live demo link — PRD bukan artefak submission wajib, sehingga Bahasa Indonesia tetap sesuai untuk koordinasi tim. |
| :---- |

# **Referensi**

| No | Sumber | Relevansi |
| :---- | :---- | :---- |
| 1 | simaarome.com/en/about | Teknologi Tournaire, visi-misi, tim spesialis 30+ tahun |
| 2 | simaarome.com/en/product | 500+ varian, Spray Dryer, Extraction, Distillation |
| 3 | sensing.konicaminolta.eu — Colour Measurement for Powders | Benchmark colorimeter (CR-5), ΔE sebagai metrik penerimaan |
| 4 | xrite.com — Food Color Measurement | Spectrophotometer Ci7520/Ci7800, QC powder/spice |
| 5 | Problem Statement PPTX (CyberHack 2026 / Hackpad) | Focus Area, pain points, judging criteria, submission |
| 6 | Dokumen Research Controme (tim) | Workflow, persona, value prop, spec warna referensi |

