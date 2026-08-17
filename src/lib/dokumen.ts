import { db } from "./db";
import { embedding } from "./gemini";
import { potong } from "./potong";

export type Dokumen = {
  id: string;
  nama: string;
  halaman: number;
  jumlahPotongan: number;
  dibuatPada: string;
};

export async function simpanDokumen(nama: string, halaman: string[]) {
  const potongan = potong(halaman);
  if (!potongan.length) throw new Error("Berkas tidak memuat teks yang bisa dibaca");

  const vektor = await embedding(
    potongan.map((bagian) => bagian.isi),
    "RETRIEVAL_DOCUMENT",
  );

  const sql = db();
  const [dokumen] = await sql`
    insert into dokumen (nama, halaman, jumlah_potongan)
    values (${nama}, ${halaman.length}, ${potongan.length})
    returning id
  `;

  for (let i = 0; i < potongan.length; i++) {
    await sql`
      insert into potongan (dokumen_id, halaman, urutan, isi, embedding)
      values (${dokumen.id}, ${potongan[i].halaman}, ${potongan[i].urutan},
              ${potongan[i].isi}, ${JSON.stringify(vektor[i])}::vector)
    `;
  }

  return { id: dokumen.id as string, jumlahPotongan: potongan.length };
}

export async function daftarDokumen(): Promise<Dokumen[]> {
  const sql = db();
  const baris = await sql`
    select id, nama, halaman, jumlah_potongan, dibuat_pada
    from dokumen
    order by dibuat_pada desc
  `;
  return baris.map((item) => ({
    id: item.id,
    nama: item.nama,
    halaman: item.halaman,
    jumlahPotongan: item.jumlah_potongan,
    dibuatPada: item.dibuat_pada,
  }));
}

export async function hapusDokumen(id: string) {
  const sql = db();
  await sql`delete from dokumen where id = ${id}`;
}
