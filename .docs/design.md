# Design — CodePath: Ojol Edition

Dokumen desain antarmuka dan pengalaman pengguna, diturunkan dari SRS Bagian 3.1, SDD Bagian 4, dan SPMP.

> **[Usulan]** = tambahan penyusun yang belum ada di dokumen sumber. **[Belum diputuskan]** = perlu keputusan tim. Kode `OQ-xx` merujuk ke `prd.md`.

---

## 1. Prinsip Desain

1. **Umpan balik cepat.** Dari menekan tombol sampai motor bergerak ≤ 100 ms (NFR-01).
2. **Peta selalu terlihat.** Keyboard tidak boleh menutupi kanvas (FR-03).
3. **Error yang membimbing.** Pesan ramah, menyebut baris, dan menunjukkan apa yang kurang.
4. **Satu tugas per layar.** Fokus pada menulis, menjalankan, lalu membaca hasil.
5. **Tanpa penjelasan materi di dalam aplikasi.** **[Usulan]** Layar hanya memuat petunjuk pemakaian dan referensi perintah.

## 2. Inventaris Layar

| Layar | Isi | Sumber |
|---|---|---|
| Daftar Level | Level beserta status gembok dan bintang | SRS 2.2 |
| Layar Permainan | Kanvas Peta + Panel Code Editor | SRS 3.1 |
| Modal Evaluasi | Jumlah bintang jika berhasil | SRS 3.1 |
| Modal Error | Baris dan pesan Syntax Error | SRS 3.1 |
| **[Usulan]** Modal Gagal (CRASH / tidak sampai) | Penyebab dan langkah terjadinya | FR-07 |

## 3. Layout Layar Permainan

**Keyboard tersembunyi**

```
┌─────────────────────────────┐
│ ←  Level 1: Maju dengan Teks│
├─────────────────────────────┤
│                             │
│     PETA (rute, titik       │
│     persimpangan, motor)    │
│                             │
├─────────────────────────────┤
│ 1  maju(3);          LOC: 2 │
│ 2  belok_kanan();           │
│ 3                           │
│                             │
│   [ Kompilasi & Jalankan ]  │
└─────────────────────────────┘
```

**Keyboard muncul** (peta mengecil menjadi sekitar separuh layar — SPMP risiko 2)

```
┌─────────────────────────────┐
│ ←  Level 1                  │
├─────────────────────────────┤
│   PETA (diperkecil, rute    │
│   dan motor tetap terlihat) │
├─────────────────────────────┤
│ 1  maju(3);          LOC: 2 │
│ 2  belok_kanan();           │
├─────────────────────────────┤
│        KEYBOARD HP          │
└─────────────────────────────┘
```

Proporsi tepatnya **[Belum diputuskan]**; usulan awal 55/45 (peta/editor) saat keyboard tersembunyi dan 40/60 saat keyboard aktif. Tombol jalankan harus tetap terjangkau di kedua keadaan.

## 4. Komponen Code Editor

| Fitur | Perilaku | Sumber |
|---|---|---|
| Penomoran baris | Tampil di kiri, sinkron dengan scroll | SRS 3.1 |
| Syntax highlighting | Pewarnaan ringan berbasis Regex (overlay di atas `TextInput`) | SDD 4.1 |
| Penghitung LOC | Diperbarui saat mengetik | FR-02 |
| Batas input | Maks. 50 baris / 1000 karakter; tampilkan sisa saat mendekati batas | SPMP |
| Sorotan baris error | Baris yang salah diberi latar merah lembut | FR-05 |
| Tombol "Kompilasi & Jalankan" | Menonaktifkan input selama animasi berjalan | FR-04 |
| Pelestarian draf | Teks terakhir dimuat ulang saat level dibuka | FR-13 |

**Skema warna sintaks [Usulan]**

| Token | Warna | Contoh |
|---|---|---|
| Perintah (keyword) | Biru | `maju`, `belok_kanan` |
| Angka | Oranye | `3` |
| Tanda baca | Abu-abu | `( ) ;` |
| Error | Merah | token atau baris bermasalah |

Font monospace, ukuran cukup besar untuk layar HP, dan kontras yang memadai.

## 5. Pesan Error

Prinsip: sebut **baris**, sebut **apa yang kurang**, gunakan bahasa yang bersahabat.

| Kondisi | Contoh pesan **[Usulan]** |
|---|---|
| Titik koma hilang | "Wah, sepertinya kamu lupa titik koma di baris 3!" (contoh dari SPMP) |
| Kurung buka hilang | "Baris 2: setelah `maju` perlu tanda `(`." |
| Kurung tutup hilang | "Baris 2: tanda `)` belum ditutup." |
| Perintah tidak dikenal | "Baris 4: perintah `mundur` belum tersedia di level ini." |
| Argumen bukan angka | "Baris 1: isi `maju( )` dengan angka, misalnya `maju(3)`." |
| Melebihi batas langkah | "Programmu berjalan terlalu lama. Ada yang berulang tanpa henti?" |

Daftar lengkap dan kode galat ada di `technical.md`.

## 6. Modal Evaluasi dan Hasil

| Hasil | Tampilan |
|---|---|
| Berhasil | Bintang 1–3 + jumlah LOC dibanding target optimal; tombol "Ulangi" dan "Level berikutnya" |
| Syntax Error | Nomor baris + pesan; baris disorot di editor; tombol "Perbaiki" |
| CRASH / tidak sampai | Penyebab (keluar jalur, tidak sampai tujuan) dan posisi berhentinya motor; tombol "Coba lagi" |

Teks bintang **[Usulan]**: tampilkan LOC pemain dan target, misalnya "Skripmu 5 baris, targetnya 4 baris."

## 7. Alur Interaksi

```
Daftar Level ──(pilih level terbuka)──► Layar Permainan
                                           │
                                  ketik skrip (draf tersimpan)
                                           │
                              [Kompilasi & Jalankan]
                                           │
                       ┌───────────────────┴───────────────────┐
                 Syntax Error                              Sintaks benar
                       │                                       │
        Modal Error + baris disorot                    Animasi motor di peta
                       │                                       │
                 kembali mengetik                  ┌───────────┴───────────┐
                                                CRASH / gagal         Sampai tujuan
                                                   │                       │
                                              Modal Gagal             Modal Evaluasi
                                                   │                  (bintang, buka
                                              kembali mengetik         level berikutnya)
```

## 8. Peta dan Animasi

- Peta nyata menampilkan **rute** dan **titik persimpangan** (node graph) (SPMP WBS 3.1).
- Ikon motor berpindah antar koordinat dengan **interpolasi** (Reanimated) dan **berotasi** sesuai bearing (FR-09).
- Kecepatan animasi: **[Belum diputuskan]**; usulan konstan per langkah dengan kontrol jeda dan percepat pada tahap lanjut.
- CRASH: motor berhenti di titik terakhir yang sah dan diberi penanda visual **[Usulan]**.
- Peta harus berfungsi tanpa internet (C-02). Lihat OQ-05.

## 9. Status Antarmuka

| Status | Perilaku |
|---|---|
| Idle | Editor aktif, tombol jalankan aktif |
| Mengetik | LOC dan penyorotan diperbarui |
| Mengompilasi | Singkat (≤ 100 ms), tidak perlu indikator |
| Error | Modal error, editor aktif kembali setelah ditutup |
| Berjalan | Input dikunci, motor beranimasi |
| Crash / selesai | Modal hasil |

## 10. Daftar Level

- Setiap level menampilkan judul, bintang terbaik, dan status gembok.
- Level terbuka setelah level sebelumnya diselesaikan dengan minimal 1 bintang **[Usulan]**.
- Jumlah level versi pertama: **[Belum diputuskan — OQ-08]**.

## 11. Keputusan Desain yang Masih Terbuka

- Proporsi layout peta dan editor, serta perilaku saat orientasi layar berubah.
- Perlu tidaknya panel referensi perintah (daftar `allowed_commands` per level).
- Bentuk umpan balik jika skrip sampai tujuan tetapi LOC boros (pesan petunjuk atau tidak).
- Apakah ada mode bebas tanpa penilaian.
