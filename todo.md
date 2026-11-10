# TODO — CodePath: Ojol Edition

Daftar kerja diturunkan dari SPMP Bagian 4 (WBS) dan Bagian 5 (Linimasa). Centang saat selesai.

> **[Usulan]** = tugas tambahan penyusun. Kode `OQ-xx` merujuk ke `prd.md`. Peran: **LA** = Lead Architect, **CE** = Compiler Engine Developer, **MA** = Map & Animation Developer, **UI** = UI & Text Editor Developer.

> **Progress 10 November 2026:** fondasi minggu 1–3 sudah diimplementasikan. Verifikasi pada development build/emulator Android masih perlu dilakukan karena MapLibre memerlukan modul native.

---

## Keputusan yang Harus Diambil Lebih Dulu **[Usulan]**

Beberapa tugas tidak bisa selesai tanpa keputusan ini. Targetkan selesai sebelum akhir Minggu 1.

- [x] OQ-03 Aturan sintaks: titik koma, argumen opsional, penamaan perintah (ADR-02)
- [x] OQ-04 Semantik belok dan model jalur (ADR-01)
- [x] OQ-09 Skema JSON level lengkap (ADR-08)
- [x] OQ-05 Strategi peta offline dan pustaka peta (ADR-06)
- [x] OQ-02 Definisi LOC (ADR-03)
- [x] OQ-01 Ambang bintang 1/2/3 (ADR-05)
- [x] OQ-06 Satuan batas langkah (ADR-07)
- [ ] OQ-07 Cakupan: apakah percabangan dan perulangan masuk versi ini
- [ ] OQ-08 Jenjang pengguna dan jumlah level versi pertama

## Minggu 1 — Inisialisasi (WBS 1.0) · Target: arsitektur AST terkunci

- [x] **1.1** (LA) Setup proyek React Native Expo dan instal dependensi (termasuk MapLibre)
- [x] **1.2** (LA) Struktur direktori dan definisi tipe AST
  - [x] Tipe `Token`, `CallExpression`, `TrajectoryStep`
  - [x] **[Usulan]** Tipe hasil kompilasi (sukses atau error dengan `line` dan `message`)
- [x] **[Usulan]** Konfigurasi TypeScript, lint, dan runner tes (Jest)
- [x] **[Usulan]** Satu level contoh (`lvl_01`) dalam JSON sebagai data uji bersama
- [ ] **[Usulan]** Lengkapi tanggal dan versi pada dokumen SRS/SDD/SPMP

## Minggu 2 — Lexer dan Peta (WBS 2.1, 3.1) · Target: Lexer berfungsi, peta tampil

- [x] **2.1** (CE) Implementasi `lexer.ts` (teks → token, membawa nomor baris)
  - [x] **[Usulan]** Tes unit: token valid, karakter tak dikenal, baris kosong
- [x] **3.1** (MA) Tampilkan graph jalan dan titik persimpangan dari data level dengan MapLibre
  - [ ] **[Usulan]** Validasi peta berfungsi tanpa internet pada development build (C-02)

## Minggu 3 — Parser, Animasi, Editor (WBS 2.2, 3.2, 4.1) · Target: error terdeteksi, motor bergerak, editor muncul

- [x] **2.2** (CE) Implementasi `parser.ts` (deteksi Syntax Error) dan `interpreter.ts`
  - [x] FR-05 Pesan error + nomor baris
  - [x] FR-06 AST → Trajectory Array
  - [x] FR-07 Deteksi CRASH
  - [x] FR-08 Batas langkah (batas statement)
- [ ] **3.2** (MA) Animasi ikon motor antar koordinat (interpolasi) dan rotasi bearing (FR-09) — kode tersedia, menunggu verifikasi Android
- [x] **4.1** (UI) `CodeEditor.tsx` dengan syntax highlighting dasar dan penomoran baris
  - [x] FR-01, FR-02 (LOC real-time)

## Minggu 4 — Keyboard dan Penilaian (WBS 4.2, 2.3) · Target: layout aman dari keyboard, bintang berfungsi

- [ ] **4.2** (UI) Keyboard handler dan modal penampil Syntax Error
  - [ ] FR-03 Layout menyesuaikan keyboard (peta tetap terlihat)
  - [ ] Verifikasi NFR-02 (tanpa UI freeze)
- [ ] **2.3** (CE) Mesin penilai berbasis LOC (FR-10 sampai FR-12)
- [ ] **[Usulan]** Penyimpanan progres dan draf (FR-13): bintang, status gembok, teks terakhir
- [ ] **[Usulan]** Layar Daftar Level dengan status gembok

## Minggu 5 — Integrasi, Pengujian, Distribusi (WBS 5.0) · Target: pengujian dan rilis APK

- [ ] **5.1** (Semua) Gabungkan Editor Teks, Kompilator, dan Peta dalam satu layar — layar awal sudah dirangkai; verifikasi native tertunda
- [ ] **5.2** (Semua) Black-box testing: ketik teks asal untuk memeriksa validasi error
  - [ ] **[Usulan]** Ukur waktu kompilasi terhadap NFR-01 (≤ 100 ms)
  - [ ] **[Usulan]** Uji pada perangkat Android fisik (versi 8.0 ke atas)
  - [ ] **[Usulan]** Uji coba dengan beberapa siswa dan catat titik macet
- [ ] **5.3** (LA) Distribusi `.apk` melalui EAS Build

## Risiko yang Dipantau (SPMP)

- [ ] Pesan error ramah dan jelas (risiko 1)
- [ ] Keyboard tidak menutupi peta (risiko 2)
- [ ] Batas 50 baris / 1000 karakter diberlakukan di editor (risiko 3)
- [ ] **[Usulan]** Peta offline terbukti bekerja sebelum Minggu 3 (risiko 4)

## Definisi Selesai **[Usulan]**

Sebuah tugas dianggap selesai jika:

1. Kodenya berjalan di perangkat atau emulator Android.
2. Ada tes otomatis untuk logika engine yang disentuh (lulus).
3. Kebutuhan terkait (FR/NFR) terpenuhi dan dicatat di PR.
4. Dokumen yang terdampak (`technical.md`, kontrak data) sudah diperbarui.
