# PRD — CodePath: Ojol Edition

| | |
|---|---|
| Versi | 0.1 (turunan dari Project Documentation v2.0) |
| Sumber | SRS, SDD, SPMP v2.0 (Revisi Skenario Teks/Pseudocode) |
| Status | Draf untuk ditinjau tim |

> **Konvensi.** **[Usulan]** = tambahan penyusun PRD yang tidak ada di dokumen sumber. **[Belum diputuskan]** = perlu keputusan tim sebelum dikerjakan. Pertanyaan terbuka diberi kode `OQ-xx` dan dirangkum di Bagian 11.

---

## 1. Ringkasan Produk

CodePath: Ojol Edition adalah aplikasi mobile Android *offline-first* untuk melatih logika pemrograman. Siswa menulis skrip **pseudocode** di editor teks, skrip dikompilasi oleh **kompilator mini** (Lexer, Parser, Interpreter), lalu dijalankan sebagai pergerakan motor ojol di atas **peta 2D nyata**. Hasil dinilai 0–3 bintang berdasarkan efisiensi jumlah baris kode (LOC).

## 2. Latar Belakang dan Masalah

Dokumen sumber tidak memuat latar belakang secara eksplisit. **[Usulan]** rumusan awal:

- Logika pemrograman bersifat abstrak; siswa sulit melihat akibat dari instruksi yang mereka tulis.
- Visualisasi langsung (kode → gerak motor di peta) memberi umpan balik yang konkret dan kontekstual.
- Pesan kesalahan sintaks yang ramah membantu siswa belajar memperbaiki kodenya sendiri.

## 3. Pengguna Target

| Pengguna | Keterangan |
|---|---|
| Siswa | Pengguna utama. Menulis skrip, menjalankan, mendapat bintang. **[Belum diputuskan — OQ-08]** jenjang dan jumlah level; arah diskusi perancangan: siswa SMA kelas X. |

Peran guru/dasbor tidak ada di dokumen sumber (lihat Bagian 5, di luar cakupan).

## 4. Tujuan dan Metrik Keberhasilan

**Tujuan produk**

1. Siswa dapat mengetik skrip pseudocode dan melihat hasilnya sebagai gerakan motor di peta.
2. Kesalahan sintaks terdeteksi dan dijelaskan dengan ramah, dengan baris yang disorot.
3. Efisiensi kode dinilai otomatis (0–3 bintang).
4. Seluruh alur berjalan tanpa internet.

**Metrik**

| Metrik | Target | Sumber |
|---|---|---|
| Waktu kompilasi dari teks sampai animasi siap | ≤ 100 ms | NFR-01 |
| Antarmuka tidak macet saat keyboard muncul/hilang | Tanpa UI freeze | NFR-02 |
| Persentase siswa menyelesaikan Level 1 tanpa bantuan | **[Belum diputuskan]** ditetapkan setelah uji coba | — |
| Jumlah percobaan rata-rata per level | **[Usulan]** dicatat saat uji coba | — |

## 5. Ruang Lingkup

**Di dalam cakupan (SRS 2.2)**

- Daftar level dengan status gembok
- Editor teks terintegrasi (nomor baris, penyorotan sintaks)
- Kompilasi skrip menjadi animasi gerak di atas peta
- Deteksi dan penampilan Syntax Error
- Penilaian bintang 0–3 berdasarkan LOC
- Penyimpanan progres, bintang, dan draf skrip secara lokal

**Di luar cakupan**

- Backend, akun, dan sinkronisasi (SRS menetapkan 100% offline)
- Platform iOS (SRS: Android minimal 8.0)
- Editor blok *drag-and-drop* (digantikan editor teks pada v2.0)
- Dasbor guru
- Struktur kontrol (percabangan dan perulangan): tidak tercantum di dokumen sumber. **[Belum diputuskan — OQ-07]**

## 6. Fitur dan User Story

| ID | User story | Rujukan | Prioritas |
|---|---|---|---|
| US-01 | Sebagai siswa, saya ingin melihat daftar level dan status gemboknya agar tahu progres saya. | SRS 2.2 | **[Usulan]** Must |
| US-02 | Sebagai siswa, saya ingin menulis skrip di editor dengan nomor baris dan warna sintaks agar mudah dibaca. | FR-01, SRS 3.1 | Must |
| US-03 | Sebagai siswa, saya ingin melihat jumlah baris kode secara langsung agar tahu seberapa efisien skrip saya. | FR-02 | Must |
| US-04 | Sebagai siswa, saya ingin peta tetap terlihat saat keyboard muncul agar saya bisa mengetik sambil melihat rute. | FR-03 | Must |
| US-05 | Sebagai siswa, saya ingin menekan "Kompilasi & Jalankan" dan melihat motor bergerak sesuai skrip. | FR-04, FR-06, FR-09 | Must |
| US-06 | Sebagai siswa, saya ingin tahu baris dan penyebab kesalahan penulisan agar bisa memperbaikinya. | FR-05 | Must |
| US-07 | Sebagai siswa, saya ingin tahu jika motor keluar jalur agar saya memahami kesalahan logika. | FR-07 | Must |
| US-08 | Sebagai siswa, saya ingin aplikasi tetap responsif meski skrip saya berulang tanpa henti. | FR-08 | Must |
| US-09 | Sebagai siswa, saya ingin mendapat bintang sesuai efisiensi kode agar termotivasi memperbaikinya. | FR-10–FR-12 | Must |
| US-10 | Sebagai siswa, saya ingin draf skrip terakhir tersimpan agar tidak hilang saat aplikasi ditutup. | FR-13 | Should |

## 7. Kebutuhan Fungsional

| ID | Kebutuhan |
|---|---|
| FR-01 | Menyediakan area pengetikan teks berlapis untuk mengedit pseudocode. |
| FR-02 | Menghitung dan menampilkan jumlah baris kode (LOC) secara *real-time*. |
| FR-03 | Menyesuaikan ukuran antarmuka otomatis saat keyboard muncul agar peta tetap terlihat sebagian. |
| FR-04 | Saat tombol "Kompilasi & Jalankan" ditekan, memproses teks skrip ke Lexer dan Parser. |
| FR-05 | Jika ada Syntax Error: menggagalkan eksekusi, menyorot baris salah, menampilkan pesan. |
| FR-06 | Jika sintaksis benar: menerjemahkan AST menjadi Trajectory Array (langkah koordinat). |
| FR-07 | Menghentikan pergerakan (CRASH) jika instruksi mengarahkan motor keluar dari jalur yang diizinkan. |
| FR-08 | Membatasi argumen gerak 1–99 dan menghentikan eksekusi jika statement melewati batas per level (default 500; ADR-07). |
| FR-09 | Menggerakkan posisi motor dan rotasi kompas (bearing) mengikuti Trajectory Array. |
| FR-10 | Bintang 1: sampai tujuan, LOC sangat boros. |
| FR-11 | Bintang 2: sampai tujuan, LOC menengah. |
| FR-12 | Bintang 3: sampai tujuan dengan perintah optimal (sesuai target Optimal Lines of Code). |
| FR-13 | Menyimpan draf teks skrip terakhir pengguna ke AsyncStorage. |

## 8. Kebutuhan Non-Fungsional dan Batasan

| ID | Kebutuhan | Sumber |
|---|---|---|
| NFR-01 | Waktu kompilasi teks ke animasi maksimal 100 ms. | SRS 5 |
| NFR-02 | Pengelolaan fokus keyboard tidak boleh menyebabkan UI freeze. | SRS 5 |
| C-01 | Android minimal 8.0. | SRS 2.3 |
| C-02 | 100% offline; peta memakai cache lokal atau batas *bounding box* minimal. | SRS 2.3 |
| C-03 | Virtual keyboard tidak boleh menutupi kanvas simulasi peta. | SRS 2.3 |
| C-04 | Editor dibatasi maksimal 50 baris / 1000 karakter. | SPMP 3 (mitigasi risiko 3) |

## 9. Aturan Penilaian (ringkas)

| Hasil | Kondisi |
|---|---|
| 0 bintang | Syntax Error, CRASH, atau tidak sampai tujuan |
| 1 bintang | Sampai tujuan, LOC sangat boros |
| 2 bintang | Sampai tujuan, LOC menengah (SDD: LOC > optimal) |
| 3 bintang | Sampai tujuan, LOC ≤ `optimal_loc` |

> Ambang bintang dan definisi LOC telah disepakati melalui ADR-03 dan ADR-05; implementasinya mengacu ke `adr.md`.

## 10. Risiko (dari SPMP)

| # | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| 1 | Syntax Error membuat siswa frustrasi | Tinggi | Pesan ramah dengan nomor baris untuk kurung, argumen, atau perintah yang keliru (ADR-02) |
| 2 | Virtual keyboard menutupi peta | Tinggi | `KeyboardAvoidingView` atau peta mengecil jadi separuh layar saat keyboard aktif |
| 3 | Parser lambat pada teks panjang | Sedang | Batas 50 baris / 1000 karakter |
| 4 | **[Usulan]** Peta offline belum diverifikasi pada perangkat | Tinggi | Validasi graph MapLibre pada development build (ADR-06) |

## 11. Pertanyaan Terbuka

Status keputusan: OQ-01 sampai OQ-06 diselesaikan oleh ADR-01 sampai ADR-07; OQ-09 diselesaikan oleh ADR-08. Pertanyaan yang masih terbuka: OQ-07 dan OQ-08.

| Kode | Pertanyaan | Status |
|---|---|---|
| OQ-01 | Ambang LOC untuk bintang 1 vs 2; apakah bintang 1 ada (SRS ada, SDD tidak)? | Diputuskan di ADR-05 |
| OQ-02 | Definisi LOC: hitung baris non-kosong, atau hitung statement (pemisah `;`)? Komentar dihitung? | Diputuskan di ADR-03 |
| OQ-03 | Aturan sintaks: titik koma wajib? Argumen opsional (`maju()` = `maju(1)`)? Gaya penamaan: `belok_kanan` atau `belokKanan`? | Diputuskan di ADR-02/04 |
| OQ-04 | Semantik `belok_kanan` dan model jalur (graf persimpangan?) yang mendasari CRASH. | Diputuskan di ADR-01 |
| OQ-05 | Strategi peta offline dan pustaka peta (MapLibre atau react-native-maps). | Diputuskan di ADR-06 |
| OQ-06 | Satuan "100 langkah eksekusi" pada FR-08: langkah trajectory atau operasi interpreter? | Diputuskan di ADR-07 |
| OQ-07 | Apakah versi ini mencakup percabangan dan perulangan? Dokumen sumber hanya memuat `maju` dan `belok_kanan`. | Belum diputuskan |
| OQ-08 | Jenjang pengguna dan jumlah level versi pertama. | Belum diputuskan |
| OQ-09 | Skema JSON level yang lengkap (simpul, sisi, titik awal, tujuan). | Diputuskan di ADR-08 |

## 12. Tim dan Peran (dari SPMP)

| Peran | Tanggung jawab |
|---|---|
| Project Manager & Lead Architect | Menjaga kontrak data AST dan rute GeoJSON, meninjau kode Parser |
| Compiler Engine Developer | Lexer, Parser, Interpreter |
| Map & Animation Developer | Peta, animasi interpolasi (Reanimated) |
| UI & Text Editor Developer | Editor teks, penyorotan sintaks, penanganan keyboard |

## 13. Rilis dan Linimasa

Lima minggu, dengan distribusi `.apk` melalui EAS Build. Rincian ada di `todo.md`.

## 14. Dokumen Terkait

`design.md` · `technical.md` · `todo.md` · `ai_context.md` · `readme.md`
