import { db } from "./db";
import { embedding } from "./gemini";

const KANDIDAT = 20;
const DIAMBIL = 5;
const KONSTANTA_RRF = 60;

export type Sumber = {
  id: string;
  dokumen: string;
  halaman: number;
  isi: string;
};

function petakan(baris: Record<string, unknown>[]): Sumber[] {
  return baris.map((item) => ({
    id: item.id as string,
    dokumen: item.dokumen as string,
    halaman: item.halaman as number,
    isi: item.isi as string,
  }));
}

function gabung(daftar: Sumber[][]): Sumber[] {
  const skor = new Map<string, number>();
  const sumber = new Map<string, Sumber>();
  for (const hasil of daftar) {
    hasil.forEach((item, peringkat) => {
      skor.set(item.id, (skor.get(item.id) ?? 0) + 1 / (KONSTANTA_RRF + peringkat + 1));
      sumber.set(item.id, item);
    });
  }
  return [...skor.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => sumber.get(id)!);
}

export async function cari(pertanyaan: string): Promise<Sumber[]> {
  const sql = db();
  const [vektor] = await embedding([pertanyaan], "RETRIEVAL_QUERY");
  const acuan = JSON.stringify(vektor);

  const [miripMakna, miripKata] = await Promise.all([
    sql`
      select p.id, d.nama as dokumen, p.halaman, p.isi
      from potongan p
      join dokumen d on d.id = p.dokumen_id
      order by p.embedding <=> ${acuan}::vector
      limit ${KANDIDAT}
    `,
    sql`
      select p.id, d.nama as dokumen, p.halaman, p.isi
      from potongan p
      join dokumen d on d.id = p.dokumen_id
      where to_tsvector('simple', p.isi) @@ plainto_tsquery('simple', ${pertanyaan})
      order by ts_rank(to_tsvector('simple', p.isi), plainto_tsquery('simple', ${pertanyaan})) desc
      limit ${KANDIDAT}
    `,
  ]);

  return gabung([petakan(miripMakna), petakan(miripKata)]).slice(0, DIAMBIL);
}
