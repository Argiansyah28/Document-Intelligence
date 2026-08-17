import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let koneksi: NeonQueryFunction<false, false> | null = null;

export function db() {
  if (!koneksi) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL belum diisi di file .env");
    koneksi = neon(url);
  }
  return koneksi;
}
