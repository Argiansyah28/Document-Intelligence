import "dotenv/config";
import { readFile } from "node:fs/promises";
import { db } from "../src/lib/db";
import { halamanDariTeks } from "../src/lib/berkas";
import { simpanDokumen } from "../src/lib/dokumen";

const NAMA = "peraturan-perusahaan.md";
const LOKASI = "src/data/peraturan-perusahaan.md";

async function main() {
  const sql = db();
  await sql`delete from dokumen where nama = ${NAMA}`;

  const isi = await readFile(LOKASI, "utf8");
  const halaman = halamanDariTeks(isi);
  const hasil = await simpanDokumen(NAMA, halaman);

  console.log(`${NAMA} tersimpan: ${halaman.length} halaman, ${hasil.jumlahPotongan} potongan.`);
}

main().catch((galat) => {
  console.error(galat.message);
  process.exit(1);
});
