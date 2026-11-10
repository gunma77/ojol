# CodePath: Ojol Edition

Aplikasi mobile Android untuk belajar logika pemrograman: tulis skrip pseudocode, lalu lihat motor ojol bergerak mengikuti kodemu di atas peta nyata. Berjalan 100% offline.

> **Status:** dalam perancangan. Bagian "Memulai" mengasumsikan proyek sudah diinisialisasi (lihat `todo.md`, WBS 1.1); sesuaikan dengan isi repositori.

---

## Cara Kerja

1. Kamu mengetik skrip di editor teks.
2. Tekan **Kompilasi & Jalankan**.
3. Kompilator mini memeriksa penulisanmu. Kalau ada yang salah, baris yang bermasalah disorot beserta pesan yang ramah.
4. Kalau benar, motor bergerak di peta sesuai skripmu.
5. Kalau sampai tujuan, kamu mendapat **0–3 bintang** berdasarkan seberapa ringkas kodemu.

## Contoh Skrip

```
maju(3);
belok_kanan();
```

Perintah yang tersedia berbeda di tiap level (`allowed_commands`). Aturan sintaks lengkap ada di `technical.md`.

## Fitur

- Editor teks dengan nomor baris, penyorotan sintaks, dan penghitung baris kode (LOC)
- Kompilator mini: Lexer → Parser → Interpreter
- Pesan Syntax Error yang ramah dengan penyorotan baris
- Deteksi motor keluar jalur (CRASH) dan perlindungan dari infinite loop
- Animasi motor di atas peta jalan nyata
- Penilaian bintang berdasarkan efisiensi LOC
- Daftar level dengan status gembok, progres dan draf skrip tersimpan lokal
- Layout menyesuaikan keyboard agar peta tetap terlihat

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Framework | React Native (Expo), TypeScript |
| Peta | MapLibre atau react-native-maps (belum diputuskan) |
| Animasi | Reanimated |
| State | Zustand |
| Penyimpanan | AsyncStorage |
| Build | EAS Build |
| Platform | Android 8.0 ke atas |

## Arsitektur Singkat

```
Presentation (UI, peta, editor)
        │
Compiler Engine (TypeScript murni: Lexer → Parser → Interpreter)
        │
State & Persistence (Zustand, AsyncStorage)
```

Mesin kompilator tidak bergantung pada UI sehingga mudah diuji tersendiri. Detail ada di `technical.md`.

## Struktur Proyek

```
src/
├─ components/editor/     # CodeEditor, penanganan keyboard
├─ engine/compiler/       # lexer.ts, parser.ts, interpreter.ts
└─ ...                    # peta, store, data level (lihat technical.md)
docs/                     # dokumen perancangan
```

## Memulai

**Prasyarat:** Node.js (LTS), perangkat Android atau emulator (Android 8.0 ke atas), dan akun Expo untuk EAS Build.

```bash
npm install
npx expo start          # jalankan dev server
npx expo run:android    # development build (jika memakai pustaka peta native)
npm test                # tes unit engine
```

Membuat APK:

```bash
eas build -p android --profile preview
```

Profil build dikonfigurasi di `eas.json`.

## Dokumentasi

| Dokumen | Isi |
|---|---|
| `prd.md` | Kebutuhan produk, cakupan, user story, pertanyaan terbuka |
| `design.md` | Desain layar, editor, alur interaksi |
| `technical.md` | Arsitektur, bahasa pseudocode, kontrak data, pengujian |
| `todo.md` | Daftar kerja per minggu |
| `ai_context.md` | Konteks ringkas untuk asisten AI dan kontributor |
| Project Documentation v2.0 | SRS, SDD, SPMP sumber |

## Tim

| Peran | Tanggung jawab |
|---|---|
| Project Manager & Lead Architect | Kontrak data AST dan rute GeoJSON, tinjauan Parser |
| Compiler Engine Developer | Lexer, Parser, Interpreter |
| Map & Animation Developer | Peta dan animasi motor |
| UI & Text Editor Developer | Editor teks dan penanganan keyboard |

Penyusun dokumen: Ananta Syawal Utama / Tim CodePath.

## Peta Jalan

Rencana lima minggu: inisialisasi, Lexer dan peta, Parser dan editor, keyboard dan penilaian, lalu pengujian dan rilis APK. Rinciannya ada di `todo.md`.

## Lisensi

Belum ditentukan.
