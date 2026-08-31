# Document Intelligence (Upload Dokumen -> Tinggal Bertanya -> Langsung Dijawab)

Asisten dokumen internal yang menjawab pertanyaan karyawan berdasarkan isi dokumen perusahaan, lengkap dengan sitasi halaman, dan menolak menjawab ketika informasinya tidak ada.

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

## Halaman Tanya Dokumen
<img width="741" height="641" alt="image" src="https://github.com/user-attachments/assets/b07cdcb5-6eda-4cca-918f-b4dce67dc30b" />

## Halaman Upload Dokumen
<img width="702" height="568" alt="image" src="https://github.com/user-attachments/assets/edfd7f7d-fac3-4c2d-8929-d0b1834093a5" />


## Masalah

Bagian HR dan IT menerima pertanyaan yang sama berulang kali — cuti, lembur, klaim kesehatan, perjalanan dinas. Jawabannya sudah tertulis di dokumen peraturan, tetapi dokumen itu panjang dan jarang dibuka.

Chatbot biasa tidak menyelesaikan masalah ini karena ia bisa mengarang jawaban, dan jawaban HR yang salah berakibat pada uang dan kepatuhan. Sistem ini dirancang dengan satu syarat utama: **setiap jawaban harus bisa ditelusuri ke halaman sumbernya, dan ketidaktahuan harus dinyatakan secara eksplisit.**



### Keputusan teknis

**Hybrid search, bukan vektor saja.** Pencarian vektor unggul memahami maksud pertanyaan, tetapi lemah pada istilah persis seperti nominal dan nama kebijakan. Pencarian kata kunci sebaliknya. Keduanya digabung dengan Reciprocal Rank Fusion sehingga tidak perlu menyetel bobot secara manual.

**Nomor halaman disimpan sejak tahap pemotongan.** Sitasi hanya berguna kalau bisa diverifikasi. Karena itu halaman diambil per halaman, bukan digabung dulu.

**Penolakan diperlakukan sebagai jawaban benar.** Tiga kasus uji sengaja menanyakan hal di luar dokumen. Sistem yang mengarang di kasus ini dianggap gagal, bukan dianggap kreatif.

**Evaluasi dijalankan dari sisi klien.** Setiap kasus uji memanggil endpoint yang sama dengan pengguna biasa, sehingga angka yang terukur adalah angka jalur produksi, bukan jalur khusus pengujian. Ini juga menghindari batas waktu eksekusi fungsi serverless.



## Keterbatasan

- Penilaian jawaban memakai pencocokan kata kunci, bukan penilaian semantik. Cara ini cepat dan deterministik, tetapi bisa menganggap salah jawaban benar yang ditulis dengan kalimat berbeda.
- Belum ada autentikasi dan pemisahan data antar pengguna. Semua dokumen terlihat oleh semua orang.
- Unggahan diproses dalam satu permintaan HTTP, sehingga dokumen sangat besar berisiko melewati batas waktu fungsi. Untuk skala produksi, proses ini dipindahkan ke antrian latar belakang.
- Belum ada caching untuk pertanyaan yang berulang.
