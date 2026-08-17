import "dotenv/config";
import { db } from "../src/lib/db";

async function main() {
  const sql = db();

  await sql`create extension if not exists vector`;

  await sql`
    create table if not exists dokumen (
      id uuid primary key default gen_random_uuid(),
      nama text not null,
      halaman integer not null,
      jumlah_potongan integer not null default 0,
      dibuat_pada timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists potongan (
      id uuid primary key default gen_random_uuid(),
      dokumen_id uuid not null references dokumen(id) on delete cascade,
      halaman integer not null,
      urutan integer not null,
      isi text not null,
      embedding vector(768) not null
    )
  `;

  await sql`
    create index if not exists potongan_embedding_idx
    on potongan using hnsw (embedding vector_cosine_ops)
  `;

  await sql`
    create index if not exists potongan_teks_idx
    on potongan using gin (to_tsvector('simple', isi))
  `;

  await sql`
    create table if not exists evaluasi (
      id uuid primary key default gen_random_uuid(),
      ringkasan jsonb not null,
      rincian jsonb not null,
      dibuat_pada timestamptz not null default now()
    )
  `;

  console.log("Tabel dan indeks siap.");
}

main().catch((galat) => {
  console.error(galat.message);
  process.exit(1);
});
