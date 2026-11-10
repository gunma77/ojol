# Technical — CodePath: Ojol Edition

Dokumentasi teknis diturunkan dari SDD (Bagian 2–5), SRS (Bagian 2–6), dan SPMP.

> **[Usulan]** = tambahan penyusun, belum ada di dokumen sumber. **[Belum diputuskan]** = perlu keputusan tim. Kode `OQ-xx` merujuk ke `prd.md`.

---

## 1. Gambaran Sistem

Arsitektur **Decoupled Client-Side**, tanpa backend, 100% offline.

```
┌───────────────────── Presentation Layer ─────────────────────┐
│ Peta (MapView) · CodeEditor (TextInput + overlay) · Modal    │
└───────────────┬──────────────────────────────▲───────────────┘
                │ skrip (string)               │ TrajectoryStep[] / error
┌───────────────▼──────────────────────────────┴───────────────┐
│ Compiler Engine Layer (TypeScript murni)                     │
│ Lexer → Parser → Interpreter → (Scoring)                     │
└───────────────┬──────────────────────────────▲───────────────┘
                │ simpan/muat                  │
┌───────────────▼──────────────────────────────┴───────────────┐
│ State & Persistence Layer (Zustand, AsyncStorage)            │
└──────────────────────────────────────────────────────────────┘
```

## 2. Teknologi

| Bagian | Pilihan | Catatan |
|---|---|---|
| Framework | React Native (Expo), TypeScript | |
| Peta | `@maplibre/maplibre-react-native` | ADR-06: graph level digambar di atas latar polos tanpa ubin jaringan |
| Animasi | Reanimated | Interpolasi antar koordinat |
| State | Zustand | Teks skrip, bintang, status level |
| Penyimpanan | AsyncStorage | Draf skrip dan progres |
| Build | EAS Build (`.apk`) | |
| Platform | Android ≥ 8.0 | |

## 3. Struktur Direktori

Dari SDD:

```
src/
├─ components/editor/       # CodeEditor.tsx + manajemen virtual keyboard
└─ engine/compiler/
   ├─ lexer.ts              # string → Token[]
   ├─ parser.ts             # Token[] → AST (melempar SyntaxError)
   └─ interpreter.ts        # AST → TrajectoryStep[]
```

**[Usulan]** tambahan: `components/map/`, `store/`, `data/levels/`, `types/`, `engine/scoring.ts`, `engine/world.ts` (model jalur).

Aturan ketergantungan: `engine/*` tidak boleh mengimpor React, React Native, peta, atau storage.

## 4. Pipeline Kompilator

### 4.1 Lexer

Membaca karakter satu per satu, membuang spasi, dan mengelompokkan menjadi token yang membawa nomor baris.

Contoh `maju(3);` →

| type | value | line |
|---|---|---|
| IDENTIFIER | `maju` | 1 |
| PUNCTUATION | `(` | 1 |
| NUMBER | `3` | 1 |
| PUNCTUATION | `)` | 1 |
| PUNCTUATION | `;` | 1 |

Token identifier membawa nama perintah; token `NEWLINE` mempertahankan batas statement. `EOF` menandai akhir masukan.

### 4.2 Parser

Memvalidasi tata bahasa dan membentuk AST. Jika aturan dilanggar, mengembalikan galat engine dengan nomor baris dan pesan ramah. Parser berhenti pada kesalahan pertama (FR-05).

Node AST (SDD 3.2): `{ type: 'CallExpression', name: 'maju', arguments: [3], line: 1 }`.

### 4.3 Interpreter

Menelusuri AST. Contoh: `maju(3)` menghasilkan 3 `TrajectoryStep` berjenis `MOVE` (SDD 5.1). Interpreter:

- memeriksa `allowed_commands` level,
- memperbarui posisi dan bearing pada model jalur,
- menghasilkan `CRASH` jika langkah keluar dari jalur (FR-07),
- menghentikan eksekusi jika melewati batas langkah (FR-08).

### 4.4 Katalog Galat **[Usulan]**

| Kode | Kondisi | Pesan |
|---|---|---|
| E01 | Karakter tidak dikenal | "Baris {n}: karakter '{c}' tidak dikenali." |
| E02 | Perintah tidak dikenal atau tidak diizinkan di level | "Baris {n}: perintah '{x}' belum tersedia di level ini." |
| E03 | Kurung buka hilang | "Baris {n}: setelah '{x}' perlu tanda '('." |
| E04 | Kurung tutup hilang | "Baris {n}: tanda ')' belum ditutup." |
| E06 | Argumen hilang, bukan angka, atau di luar rentang | "Baris {n}: isi '{x}( )' dengan angka 1–99." |
| E07 | Melebihi batas statement | "Baris {n}: batas perintah terlampaui." |
| E08 | Lebih dari satu statement per baris | "Baris {n}: satu perintah saja untuk setiap baris." |
| E09 | Batas input terlampaui | "Skrip dibatasi hingga 50 baris / 1000 karakter." |
| E10 | Data level tidak valid | Pesan menunjuk simpul atau ruas yang tidak valid. |

## 5. Spesifikasi Bahasa Pseudocode

### 5.1 Sintaks versi pertama (ADR-02, ADR-04)

Setiap baris berisi paling banyak satu statement. Titik koma opsional hanya sebagai penutup baris; komentar dimulai dengan `#`.

```
program    := { statement }
statement  := call [ ";" ] NEWLINE
call       := IDENT "(" [ NUMBER ] ")"
IDENT      := "maju" | "mundur" | "belokKanan" | "belokKiri" | "putarBalik"
NUMBER     := digit { digit }
komentar   := "#" sampai akhir baris
```

`maju(n)` dan `mundur(n)` memerlukan bilangan bulat 1–99. Perintah belok tidak menerima argumen. Nama peka huruf besar-kecil dan perintah harus ada pada `allowed_commands`. Dua statement dalam satu baris adalah Syntax Error. LOC mengikuti ADR-03: jumlah baris berisi statement; komentar dan baris kosong diabaikan.

### 5.2 Perluasan jika cakupan mencakup percabangan dan perulangan **[Belum diputuskan — OQ-07]**

Dokumen sumber belum memuat struktur kontrol. Jika versi ini diperluas, kandidat sintaks:

```
# perintah gerak tambahan
belokKanan();  belokKiri();  putarBalik();

# percabangan
jika (jalan.macetTotal) {
  putarBalik();
} lainJika (jalan.adaPortal) {
  belokKanan();
} lain {
  maju(1);
}

# perulangan
ulang(5) { maju(1); }
selama (jalan.diDepanKosong) { maju(1); }
```

Catatan untuk keputusan ini:

- Perlu node AST baru (`IfStatement`, `RepeatStatement`, `WhileStatement`), ekspresi kondisi, dan sensor `jalan.*` yang dibaca interpreter dari model jalur.
- Batas langkah FR-08 baru benar-benar relevan setelah ada perulangan.
- Perilaku `selama` pada pertigaan (berhenti otomatis lalu lanjut ke baris berikutnya) harus dirumuskan eksplisit di spesifikasi.
- Gaya penamaan harus seragam dengan versi dasar (snake_case atau camelCase).

## 6. Model Dunia dan Level

### 6.1 Skema historis dokumen sumber

Contoh ini menggunakan nama perintah lama dan telah digantikan oleh skema v1 di Bagian 6.2.

```json
{
  "level_id": "lvl_01",
  "title": "Maju dengan Teks",
  "allowed_commands": ["maju", "belok_kanan"],
  "optimal_loc": 4,
  "nodes": { "...": "..." }
}
```

### 6.2 Skema level v1 (diterima lewat ADR-08)

```json
{
  "level_id": "lvl_01",
  "title": "Maju dengan Teks",
  "allowed_commands": ["maju", "belokKanan"],
  "optimal_loc": 4,
  "start": { "node": "A", "bearing": 90 },
  "goal": "D",
  "nodes": { "A": [107.6070, -6.9215], "B": [107.6085, -6.9218] },
  "edges": [
    { "from": "A", "to": "B", "bearing": 90 }
  ]
}
```

- `maju(n)` memindahkan motor n simpul menurut sisi keluar yang searah bearing; jika tidak ada sisi, hasilnya `CRASH`.
- `belokKanan()` mengubah bearing +90° tanpa mengubah posisi; semantik lengkap ada di ADR-01.
- Ruas berarah; jalan dua arah ditulis sebagai dua edge.
- `star_thresholds` dan `max_statements` opsional mengikuti ADR-05 dan ADR-07.

## 7. Kontrak Data

```ts
// Token (SDD 3.2)
interface Token {
  type: 'IDENTIFIER' | 'NUMBER' | 'PUNCTUATION' | 'NEWLINE' | 'EOF';
  value: string;
  line: number;
}

// AST (SDD 3.2)
interface CallExpression {
  type: 'CallExpression';
  name: string;
  arguments: number[];
  line: number;
}

// Trajectory (SDD 3.3)
interface TrajectoryStep {
  stepIndex: number;
  action: 'MOVE' | 'TURN' | 'CRASH';
  coordinate: [number, number];                 // [longitude, latitude]
  bearing: number;                              // 0–360
  nodeId: string;
  line: number;
}

// Hasil kompilasi dan eksekusi
type CompileResult =
  | {
      ok: true;
      trajectory: TrajectoryStep[];
      loc: number;
      finalNode: string;
      finalBearing: number;
      reachedGoal: boolean;
      crashed: boolean;
    }
  | { ok: false; loc: number; error: { code: string; line: number; message: string } };
```

Catatan koordinat: kontrak memakai `[longitude, latitude]` (urutan GeoJSON). Pustaka peta React Native umumnya memakai objek `{ latitude, longitude }`; konversi dilakukan hanya di lapisan peta.

## 8. Penilaian (Scoring Engine)

Penilaian memakai **LOC**, bukan jumlah blok. Error sintaks, CRASH, atau tidak mencapai tujuan menghasilkan 0 bintang; hanya best-star disimpan. Aturan lengkap ditetapkan ADR-05.

LOC dihitung sesuai ADR-03: satu baris berisi paling banyak satu statement; baris kosong dan komentar tidak dihitung.

Ambang bawaan sesuai ADR-05, dengan `T = optimal_loc`:

| Bintang | Syarat |
|---|---|
| 3 | tujuan tercapai dan LOC ≤ T |
| 2 | tujuan tercapai dan LOC ≤ ceil(1,5 × T) |
| 1 | tujuan tercapai, LOC lebih dari itu |
| 0 | error, CRASH, atau tidak sampai tujuan |

Level dapat menetapkan `star_thresholds.three` dan `star_thresholds.two`; jika tidak ada, ambang 1,5 × T dipakai.

## 9. Peta dan Animasi

- Peta menampilkan rute dan titik persimpangan dari data level (SPMP WBS 3.1).
- Animator memutar `TrajectoryStep[]` secara berurutan: interpolasi posisi dengan Reanimated dan rotasi sesuai `bearing` (FR-09).
- Animasi hanya memutar hasil; tidak menjalankan logika kompilator.

**Peta offline (ADR-06).** MapLibre menggambar edge, simpul, dan motor dari data level di atas latar polos. Tidak ada basemap atau permintaan jaringan pada versi pertama. MapLibre Native memerlukan development build; Expo Go tidak menyediakan modul tersebut.

## 10. State dan Persistensi

**[Usulan]** kunci AsyncStorage:

| Kunci | Isi |
|---|---|
| `codepath/progress` | `{ [levelId]: { stars: 0–3, unlocked: boolean } }` |
| `codepath/draft/{levelId}` | string skrip terakhir (FR-13) |

Zustand menyimpan skrip aktif, status kompilasi, hasil, dan progres; disinkronkan ke AsyncStorage saat berubah. Karena skrip dibatasi 1000 karakter, ukuran data kecil.

## 11. Editor dan Keyboard

- `TextInput multiline` dengan **overlay** pewarnaan sintaks berbasis Regex (SDD 4.1).
- Penomoran baris sinkron dengan scroll.
- `KeyboardAvoidingView` agar peta mengecil dan editor tetap bisa diketik (FR-03, SPMP risiko 2).
- Batas 50 baris / 1000 karakter.
- Pewarnaan overlay harus disejajarkan dengan teks (font, ukuran, padding sama); uji pada beberapa ukuran layar.

## 12. Performa dan Batas

| Batas | Nilai | Sumber |
|---|---|---|
| Waktu kompilasi teks → animasi siap | ≤ 100 ms | NFR-01 |
| UI tidak macet saat fokus keyboard berubah | tanpa freeze | NFR-02 |
| Argumen gerak | Bilangan bulat 1–99 | ADR-07 |
| Maksimum statement | 500 secara default; dapat ditimpa per level | ADR-07 |
| Panjang skrip | 50 baris / 1000 karakter | SPMP |

Tanpa perulangan (OQ-07), batas statement 500 tidak tercapai oleh editor 50 baris, tetapi interpreter tetap menerapkan batas ini sebagai guard.

## 13. Pengujian

Strategi dari SPMP: **black-box testing** (mengetik teks asal untuk memeriksa validasi error). **[Usulan]** tambahkan tes unit untuk engine murni.

| Lapisan | Jenis tes | Contoh |
|---|---|---|
| Lexer | Unit | `maju(3);` menghasilkan 5 token dengan baris yang benar |
| Parser | Unit | `maju(3)` valid tanpa `;`; dua statement dalam satu baris menghasilkan E08 |
| Interpreter | Unit | `maju(3);` menghasilkan 3 langkah `MOVE`; langkah keluar jalur menghasilkan `CRASH` |
| Batas langkah | Unit | Eksekusi yang terlalu panjang dihentikan dengan E07 |
| Penilai | Unit | Tabel input LOC dan hasil bintang |
| Performa | Unit | Kompilasi skrip 50 baris ≤ 100 ms |
| Integrasi | Manual/otomatis | Ketik, jalankan, animasi, modal hasil |
| Uji pengguna | Manual | Beberapa siswa mencoba; catat titik macet |

Kasus black-box awal: teks kosong, hanya spasi, karakter acak, kurung tak seimbang, angka sangat besar, huruf kapital (`Maju(3);`), dua perintah dalam satu baris, 51 baris.

## 14. Build dan Distribusi

- Distribusi `.apk` melalui EAS Build (SPMP WBS 5.3); atur profil `preview` agar menghasilkan APK.
- Minimum Android 8.0.
- **[Usulan]** Uji pada perangkat fisik, bukan hanya emulator.

## 15. Keputusan Arsitektur Utama (ringkas)

| Keputusan | Alasan |
|---|---|
| Engine kompilator sebagai TypeScript murni | Mudah diuji, bebas dari UI |
| Semua pemrosesan di perangkat | Offline-first, hasil instan |
| Editor teks menggantikan editor blok | Revisi v2.0: melatih penulisan kode sebenarnya |
| Penilaian berbasis LOC | Mendorong kode yang ringkas |
| Trajectory Array sebagai perantara | Memisahkan logika dari animasi |

## 16. Isu Terbuka (ringkasan)

| Kode | Isu |
|---|---|
| OQ-07 | Percabangan dan perulangan |
| OQ-08 | Jenjang pengguna dan jumlah level |

Isu kecil pada dokumen sumber: tanggal masih berisi placeholder dan judul "5. Kebutuhan Non-Fungsional" menyatu dengan NFR-01.
