# AI Context — CodePath: Ojol Edition

File ini memberi konteks singkat bagi asisten AI (dan kontributor baru) agar bekerja konsisten dengan keputusan proyek. Sumber kebenaran: `prd.md`, `technical.md`, dan Project Documentation v2.0 (SRS, SDD, SPMP).

> **[Usulan]** = belum ada di dokumen sumber. **[Belum diputuskan]** = jangan diasumsikan; tanyakan dulu. Kode `OQ-xx` merujuk ke `prd.md`.

---

## 1. Ringkasan

Aplikasi mobile Android **offline-first** untuk melatih logika pemrograman. Siswa mengetik **pseudocode**, kompilator mini mengubahnya menjadi **Trajectory Array**, lalu motor ojol bergerak di **peta 2D nyata**. Hasil dinilai 0–3 bintang berdasarkan jumlah baris kode (LOC).

## 2. Status

Implementasi minggu 1–3 sedang berjalan: fondasi compiler, fixture level, editor, dan sinkronisasi trajectory ke peta sudah tersedia. Verifikasi native MapLibre perlu development build Android.

## 3. Tech Stack

| Bagian | Teknologi |
|---|---|
| Framework | React Native (Expo), TypeScript |
| Peta | MapLibre React Native (ADR-06, offline tanpa basemap) |
| Animasi | Reanimated |
| State | Zustand |
| Persistensi | AsyncStorage |
| Build | EAS Build (`.apk`) |
| Platform | Android ≥ 8.0 |

## 4. Arsitektur (3 lapisan)

1. **Presentation Layer**: komponen React Native, peta, editor teks (`TextInput` multiline + overlay highlighting).
2. **Compiler Engine Layer**: TypeScript murni. `lexer.ts` → `parser.ts` → `interpreter.ts`.
3. **State & Persistence Layer**: Zustand + AsyncStorage (draf skrip, bintang, status level).

Alur data:

```
teks → Lexer → Token[] → Parser → AST → Interpreter → TrajectoryStep[] → Animator (peta)
                                                    └→ Scoring (LOC, tujuan) → bintang
```

## 5. Peta Direktori

```
src/
├─ components/
│  └─ editor/           # CodeEditor.tsx, keyboard handling   (dari SDD)
├─ engine/
│  └─ compiler/         # lexer.ts, parser.ts, interpreter.ts (dari SDD)
├─ components/map/      # MapLibre + animasi motor
├─ store/               # [Usulan] Zustand
├─ data/levels/         # JSON level
└─ types/               # [Usulan] Token, AST, TrajectoryStep
```

## 6. Kontrak Data Inti

```ts
type TokenType = 'IDENTIFIER' | 'NUMBER' | 'PUNCTUATION' | 'NEWLINE' | 'EOF';
interface Token { type: TokenType; value: string; line: number }

interface CallExpression {            // contoh: maju(3)
  type: 'CallExpression';
  name: string;                        // 'maju'
  arguments: number[];                 // [3]
  line: number;                        // [Usulan] untuk pesan error
}

interface TrajectoryStep {
  stepIndex: number;
  action: 'MOVE' | 'TURN' | 'CRASH';
  coordinate: [number, number];        // [longitude, latitude]
  bearing: number;                     // 0–360
}
```

Level (JSON): `level_id`, `title`, `allowed_commands`, `optimal_loc`, `start`, `goal`, `nodes`, `edges`; lihat ADR-08.

## 7. Bahasa Pseudocode (versi dokumen sumber)

```
maju(3)
belokKanan()
```

- Perintah dasar: `maju(n)`, `mundur(n)`, `belokKanan()`, `belokKiri()`, `putarBalik()`; level membatasi lewat `allowed_commands`.
- Sintaks: satu perintah per baris, titik koma opsional, argumen gerak wajib 1–99, komentar `#`, nama camelCase yang case-sensitive (ADR-02/04).
- Percabangan dan perulangan **[Belum diputuskan — OQ-07]**; lihat usulan di `technical.md` Bagian 5.

## 8. Aturan Kerja untuk AI

**Lakukan**

- Jaga **Compiler Engine** sebagai TypeScript murni: tanpa impor React Native, tanpa akses peta atau storage.
- Pisahkan tahap Lexer, Parser, dan Interpreter; tiap tahap punya tes sendiri.
- Setiap kesalahan sintaks membawa **nomor baris** dan pesan berbahasa Indonesia yang ramah.
- Interpreter memberlakukan **batas langkah** (FR-08) dan mendeteksi CRASH (FR-07).
- Koordinat di engine memakai `[longitude, latitude]`; ubah ke format pustaka peta hanya di lapisan peta.
- Tulis tes unit untuk setiap perubahan pada engine; pantau NFR-01 (≤ 100 ms).
- Tandai asumsi baru sebagai **[Usulan]** di dokumen, bukan mengubah kontrak diam-diam.

**Jangan**

- Jangan memakai `eval` atau `new Function` pada skrip siswa.
- Jangan menambah perintah atau sintaks di luar yang disepakati.
- Jangan menambah backend, akun, atau panggilan jaringan (aplikasi 100% offline).
- Jangan menaruh penjelasan materi pelajaran di dalam aplikasi; hanya petunjuk pemakaian dan referensi perintah **[Usulan]**.
- Jangan mengubah kontrak `Token`, `AST`, `TrajectoryStep` tanpa persetujuan Lead Architect (SPMP).
- Jangan menebak jawaban untuk hal yang bertanda **[Belum diputuskan]**; ajukan pertanyaan.

## 9. Perintah Umum

Berlaku setelah proyek diinisialisasi (WBS 1.1); sesuaikan dengan `package.json`.

```bash
npm install
npx expo start            # jalankan dev server
npx expo run:android      # development build (diperlukan jika memakai pustaka peta native)
npm test                  # tes unit engine
```

## 10. Glosarium

| Istilah | Arti |
|---|---|
| Pseudocode | Bahasa teks fiktif yang mirip bahasa natural untuk melatih algoritma |
| Lexer | Memecah teks menjadi token |
| Parser | Memvalidasi tata bahasa dan membentuk AST |
| AST | Pohon sintaks abstrak |
| Interpreter | Menelusuri AST dan menghasilkan Trajectory Array |
| Trajectory Array | Daftar langkah (koordinat, aksi, bearing) untuk animasi |
| LOC | Jumlah baris kode, dipakai untuk penilaian efisiensi |
| CRASH | Motor keluar dari jalur yang diizinkan |

## 11. Pertanyaan Terbuka yang Mempengaruhi Kode

OQ-07 percabangan/perulangan dan OQ-08 jenjang/jumlah level masih terbuka. OQ-01 sampai OQ-06 dan OQ-09 telah diputuskan dalam `adr.md`.

## 12. Dokumen Terkait

`prd.md` · `design.md` · `technical.md` · `todo.md` · `readme.md`
