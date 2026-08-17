# Tanya Dokumen

Asisten dokumen internal yang menjawab pertanyaan karyawan berdasarkan isi dokumen perusahaan, lengkap dengan sitasi halaman, dan menolak menjawab ketika informasinya tidak ada.

## Masalah

Bagian HR dan IT menerima pertanyaan yang sama berulang kali — cuti, lembur, klaim kesehatan, perjalanan dinas. Jawabannya sudah tertulis di dokumen peraturan, tetapi dokumen itu panjang dan jarang dibuka.

Chatbot biasa tidak menyelesaikan masalah ini karena ia bisa mengarang jawaban, dan jawaban HR yang salah berakibat pada uang dan kepatuhan. Sistem ini dirancang dengan satu syarat utama: **setiap jawaban harus bisa ditelusuri ke halaman sumbernya, dan ketidaktahuan harus dinyatakan secara eksplisit.**

## Hasil pengukuran

Diukur pada 20 kasus uji (17 pertanyaan terjawab, 3 pertanyaan di luar dokumen):

| Metrik | Arti |
|---|---|
| Jawaban benar | Kata kunci jawaban yang benar muncul di jawaban |
| Retrieval tepat | Potongan yang diambil memang memuat jawabannya |
| Penolakan tepat | Sistem menolak menjawab saat informasi tidak ada |
| Latensi p95 | 95% pertanyaan dijawab lebih cepat dari angka ini |

Angka aktual dihasilkan dengan menjalankan halaman `/evaluasi`, dan setiap hasil pengukuran tersimpan di database sebagai riwayat sehingga perubahan prompt atau parameter bisa dibandingkan.

## Arsitektur

```
FASE 1 — INDEXING

  PDF / Markdown / TXT
        │
        ▼  unpdf, teks diambil per halaman
  Potong 800 huruf, tindih 150, dipotong di batas kalimat
        │
        ▼  Gemini text-embedding-004, taskType RETRIEVAL_DOCUMENT
  Simpan ke Postgres (pgvector) bersama nomor halaman


FASE 2 — RETRIEVAL & GENERATION

  Pertanyaan
        │
        ├─► Pencarian vektor       cosine distance, indeks HNSW      → 20 kandidat
        └─► Pencarian kata kunci   tsvector + ts_rank, indeks GIN    → 20 kandidat
                    │
                    ▼  Reciprocal Rank Fusion (k = 60)
              5 potongan terbaik
                    │
                    ▼  prompt terkunci konteks, temperature 0
        Jawaban bersitasi [1][2] atau TIDAK DITEMUKAN
```

### Keputusan teknis

**Hybrid search, bukan vektor saja.** Pencarian vektor unggul memahami maksud pertanyaan, tetapi lemah pada istilah persis seperti nominal dan nama kebijakan. Pencarian kata kunci sebaliknya. Keduanya digabung dengan Reciprocal Rank Fusion sehingga tidak perlu menyetel bobot secara manual.

**Nomor halaman disimpan sejak tahap pemotongan.** Sitasi hanya berguna kalau bisa diverifikasi. Karena itu halaman diambil per halaman, bukan digabung dulu.

**Penolakan diperlakukan sebagai jawaban benar.** Tiga kasus uji sengaja menanyakan hal di luar dokumen. Sistem yang mengarang di kasus ini dianggap gagal, bukan dianggap kreatif.

**Evaluasi dijalankan dari sisi klien.** Setiap kasus uji memanggil endpoint yang sama dengan pengguna biasa, sehingga angka yang terukur adalah angka jalur produksi, bukan jalur khusus pengujian. Ini juga menghindari batas waktu eksekusi fungsi serverless.

## Struktur

```
src/
  lib/
    berkas.ts      Membaca PDF dan teks menjadi daftar halaman
    potong.ts      Pemotongan dengan tindihan di batas kalimat
    gemini.ts      Klien embedding dan pembuatan jawaban
    dokumen.ts     Simpan, daftar, hapus dokumen
    pencarian.ts   Hybrid search dan Reciprocal Rank Fusion
    jawaban.ts     Penyusunan prompt dan alur menjawab
    skor.ts        Penilaian evaluasi, murni tanpa efek samping
    db.ts          Koneksi Neon
  app/
    page.tsx       Halaman tanya jawab
    dokumen/       Pengelolaan dokumen
    evaluasi/      Penjalan dan riwayat evaluasi
    api/           Endpoint tanya, dokumen, evaluasi
  data/
    peraturan-perusahaan.md   Dokumen contoh
    evaluasi.json             20 kasus uji
scripts/
  setup.ts         Membuat tabel dan indeks
  seed.ts          Memasukkan dokumen contoh
```

## Menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
cp .env.example .env
```

Isi `.env`:

- `DATABASE_URL` — buat database gratis di [neon.tech](https://neon.tech), salin connection string
- `GOOGLE_API_KEY` — ambil di [aistudio.google.com](https://aistudio.google.com/apikey), gratis

```bash
npm run db:setup
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`, lalu jalankan pengukuran di `http://localhost:3000/evaluasi`.

## Deploy

Dorong ke GitHub, hubungkan repo di [vercel.com](https://vercel.com), tambahkan `DATABASE_URL` dan `GOOGLE_API_KEY` sebagai environment variable, lalu deploy. Setelah live, jalankan `npm run db:setup` dan `npm run db:seed` sekali dari komputer lokal dengan `.env` yang menunjuk database yang sama.

## Keterbatasan

- Penilaian jawaban memakai pencocokan kata kunci, bukan penilaian semantik. Cara ini cepat dan deterministik, tetapi bisa menganggap salah jawaban benar yang ditulis dengan kalimat berbeda.
- Belum ada autentikasi dan pemisahan data antar pengguna. Semua dokumen terlihat oleh semua orang.
- Unggahan diproses dalam satu permintaan HTTP, sehingga dokumen sangat besar berisiko melewati batas waktu fungsi. Untuk skala produksi, proses ini dipindahkan ke antrian latar belakang.
- Belum ada caching untuk pertanyaan yang berulang.
