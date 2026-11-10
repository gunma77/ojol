# ADR — CodePath: Ojol Edition

Catatan keputusan arsitektur dan desain, diambil pada sesi keputusan **10 November 2026**. Setiap ADR memuat konteks, opsi yang dipertimbangkan, keputusan, dan konsekuensi. Status semua ADR di bawah: **Diterima**.

> Kode `OQ-xx` merujuk ke pertanyaan terbuka di `prd.md`. Nilai angka yang bertanda **(awal)** adalah titik mulai yang perlu diuji, bukan hasil perhitungan.

| ADR | Judul | Menyelesaikan |
|---|---|---|
| ADR-01 | Semantik belok dan tujuan tercapai | OQ-04 |
| ADR-02 | Aturan sintaks | OQ-03 |
| ADR-03 | Definisi LOC | OQ-02 |
| ADR-04 | Perintah dasar | OQ-03 (sebagian) |
| ADR-05 | Ambang bintang | OQ-01 |
| ADR-06 | Peta offline | OQ-05 |
| ADR-07 | Batas eksekusi | OQ-06 |
| ADR-08 | Skema data level | OQ-09 |

---

## ADR-01 — Semantik belok dan tujuan tercapai

**Konteks.** SRS dan SDD hanya menyebut `belok_kanan` tanpa menjelaskan artinya, padahal ini menentukan model jalur dan kapan terjadi CRASH.

**Opsi.**
- A. Putar di tempat; `maju` memilih jalan paling searah (dalam toleransi sudut).
- B. Pilih jalan keluar terdekat di sisi kanan arah hadap.
- C. Belok sambil berpindah satu ruas.

**Keputusan.** Opsi A.
- Motor selalu berada di sebuah simpul dengan `bearing` tertentu.
- `belokKanan()` = bearing +90°, `belokKiri()` = −90°, `putarBalik()` = +180°, tanpa mengubah posisi.
- `maju(n)` memilih ruas keluar yang paling searah dengan bearing; `mundur(n)` memilih yang paling searah dengan bearing + 180° dan tidak mengubah bearing.
- Jika tidak ada ruas dalam toleransi sudut (awal: ±45°), hasilnya `CRASH` di simpul terakhir yang sah.
- Tujuan tercapai jika **posisi akhir saat skrip selesai** sama dengan simpul tujuan.

**Konsekuensi.**
- Belok menghasilkan satu langkah `TURN`; rotasi kompas animasi (FR-09) mengikuti bearing.
- Level harus divalidasi: untuk tiap simpul dan tiap bearing yang bisa dicapai (bearing awal ditambah kelipatan 90°), tidak boleh ada dua ruas dalam toleransi yang sama.
- Melewati tujuan di tengah jalan tidak cukup.

---

## ADR-02 — Aturan sintaks

**Konteks.** Dokumen sumber memakai contoh `maju(3);` dengan nama `belok_kanan`, dan menyebut "lupa titik koma" sebagai kesalahan.

**Opsi.** Titik koma wajib atau opsional; argumen `maju` opsional (bawaan 1) atau wajib; penamaan snake_case atau camelCase.

**Keputusan.**
- Titik koma **opsional**.
- `maju(n)` dan `mundur(n)` **selalu memakai angka** (bilangan bulat positif).
- Instruksi yang hanya mengganti arah di tempat **tidak memakai angka**.
- Penamaan **camelCase**.
- Bahasa **peka huruf besar-kecil**; komentar memakai `#`.

**Konsekuensi.**
- Pesan "lupa titik koma" di SPMP tidak berlaku; diganti pesan untuk kurung, angka, dan perintah tak dikenal.
- `allowed_commands` di JSON level memakai camelCase.
- `maju()` tanpa angka dan `belokKanan(2)` menjadi kesalahan sintaks.
- Salah huruf besar-kecil (`Maju`) menghasilkan pesan petunjuk, bukan diterima diam-diam.

---

## ADR-03 — Definisi LOC

**Konteks.** SDD memecah teks berdasarkan `;` atau `\n`, yang bisa memberi hitungan berbeda untuk skrip yang sama. Dengan titik koma opsional, ketidakjelasan ini bertambah.

**Opsi.**
- A. Banyak statement sebaris; LOC = jumlah statement.
- B. Banyak statement sebaris; LOC = jumlah baris.
- C. Satu statement per baris; LOC = baris berisi statement.

**Keputusan.** Opsi C.
- Statement berakhir di baris baru; `;` hanya penutup opsional di akhir baris.
- Dua statement dalam satu baris menghasilkan kesalahan ramah.
- LOC = jumlah baris yang berisi statement; baris kosong dan komentar tidak dihitung.

**Konsekuensi.** LOC sama dengan yang terlihat di editor, tidak bisa dimanipulasi, dan parser lebih sederhana. Gaya menulis menjadi lebih terbatas.

---

## ADR-04 — Perintah dasar

**Konteks.** Dokumen sumber hanya menyebut `maju` dan `belok_kanan`.

**Keputusan.** Perintah dasar: `maju(n)`, `mundur(n)`, `belokKanan()`, `belokKiri()`, `putarBalik()`. Ketersediaannya dibatasi per level lewat `allowed_commands`.

**Konsekuensi.** Level awal dapat hanya mengizinkan sebagian perintah. Daftar ini belum mencakup percabangan dan perulangan (OQ-07).

---

## ADR-05 — Ambang bintang

**Konteks.** SRS mendefinisikan bintang 1–3, SDD hanya 0, 2, dan 3. Batas "boros" dan "menengah" belum terukur.

**Opsi.**
- A. Rumus tunggal 1,5 × T untuk semua level (T = `optimal_loc`).
- B. Selisih tetap T + 2.
- C. Batas per level di JSON, dengan rumus A sebagai bawaan.

**Keputusan.** Opsi C.
- Level dapat memuat `star_thresholds: { "three": ..., "two": ... }`.
- Bawaan jika kosong: 3★ jika LOC ≤ T; 2★ jika LOC ≤ ceil(1,5 × T); selain itu 1★.
- 1–3 bintang hanya untuk percobaan yang berhasil; error, CRASH, atau tidak sampai tujuan = 0★ dan tidak mengurangi bintang yang sudah ada.
- Bintang yang disimpan per level adalah **bintang terbaik**.
- LOC di bawah T tetap 3★ dan dicatat sebagai sinyal bahwa `optimal_loc` perlu ditinjau.

**Konsekuensi.** Skema level mendapat kolom opsional baru. Perbedaan SRS dan SDD mengenai bintang 1 selesai.

---

## ADR-06 — Peta offline

**Konteks.** SRS mewajibkan 100% offline, tetapi cara menyediakan ubin peta tanpa internet belum ditetapkan. Pustaka MapLibre untuk React Native memiliki modul paket offline (membuat paket berdasarkan wilayah dan zoom, serta memuat basis data offline dari berkas). Server ubin publik OpenStreetMap melarang penggunaan offline dan unduhan massal; untuk kebutuhan itu disarankan ubin yang dihosting sendiri atau penyedia yang mengizinkan.

**Opsi.**
- A. Unduh paket peta saat pertama online.
- B. Ubin lokal buatan sendiri.
- C. Gambar jaringan jalan dari GeoJSON level, tanpa ubin dasar.
- D. Online dengan cache.

**Keputusan.** Opsi C untuk versi pertama.
- MapLibre menggambar jalan, simpul, dan penanda motor dari data level di atas latar polos.
- Koordinat dan bentuk jalan tetap nyata (Bandung), tampilannya skematik.
- Opsi B menjadi peningkatan nanti, didahului percobaan kecil untuk memverifikasi format ubin yang diterima.

**Konsekuensi.**
- Tidak ada ketergantungan pada penyedia ubin atau ketentuannya; risiko terbesar proyek berkurang.
- Atribusi OpenStreetMap tetap dicantumkan karena data jalan bersumber dari sana.
- Teks label di dalam peta memerlukan font yang tersedia offline; verifikasi, atau gunakan label di lapisan UI.
- Pustaka peta dipilih: MapLibre (React Native); kemungkinan memerlukan development build.

---

## ADR-07 — Batas eksekusi

**Konteks.** FR-08 menyebut "100 langkah eksekusi" tanpa jelas apa yang dihitung. Dua hal berbeda perlu dibatasi: besar argumen `maju(n)` dan jumlah pernyataan yang dijalankan interpreter.

**Opsi.**
- A. Satu batas 100 langkah di peta.
- B. Dua batas terpisah.
- C. Tunda sampai OQ-07.

**Keputusan.** Opsi B.
- Argumen `n` hanya boleh 1–99; di luar itu menjadi kesalahan sintaks.
- Jumlah pernyataan yang dieksekusi dibatasi (awal: 500, dapat diatur per level lewat `max_statements`); melebihinya menghentikan eksekusi.

**Konsekuensi.** Tanpa perulangan (OQ-07), skrip paling panjang 50 baris sehingga batas pernyataan belum akan tercapai; ia menjadi relevan penuh begitu perulangan masuk. Nilai 500 perlu diuji.

---

## ADR-08 — Skema data level

**Konteks.** Engine, peta, dan animator membutuhkan kontrak level yang sama.

**Keputusan.** Gunakan skema usulan pada `technical.md` Bagian 6.2:
- `level_id`, `title`, `allowed_commands`, `optimal_loc`, `start`, `goal`, `nodes`, dan `edges`.
- Koordinat simpul memakai `[longitude, latitude]`; `start` memuat `node` dan `bearing`.
- `edges` adalah ruas berarah `{ from, to, bearing }`; arah balik harus dinyatakan sebagai ruas tersendiri.
- `star_thresholds` dan `max_statements` bersifat opsional.
- Nama perintah pada `allowed_commands` mengikuti camelCase ADR-02.

**Konsekuensi.** Engine memakai graph level yang sama dengan GeoJSON yang digambar MapLibre. Level divalidasi sebelum dijalankan; arah jalan harus ditulis eksplisit.

## Belum diputuskan

| Kode | Isu |
|---|---|
| OQ-07 | Apakah versi ini mencakup percabangan dan perulangan |
| OQ-08 | Jenjang pengguna dan jumlah level |
