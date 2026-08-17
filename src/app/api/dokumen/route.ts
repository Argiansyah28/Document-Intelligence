import { NextResponse } from "next/server";
import { bacaHalaman, didukung } from "@/lib/berkas";
import { daftarDokumen, simpanDokumen } from "@/lib/dokumen";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATAS_UKURAN = 8 * 1024 * 1024;

export async function GET() {
  try {
    return NextResponse.json(await daftarDokumen());
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}

export async function POST(permintaan: Request) {
  const formulir = await permintaan.formData();
  const berkas = formulir.get("berkas");

  if (!(berkas instanceof File)) {
    return NextResponse.json({ galat: "Berkas belum dipilih" }, { status: 400 });
  }
  if (!didukung(berkas.name)) {
    return NextResponse.json({ galat: "Format didukung: PDF, MD, TXT" }, { status: 400 });
  }
  if (berkas.size > BATAS_UKURAN) {
    return NextResponse.json({ galat: "Ukuran berkas melebihi 8 MB" }, { status: 400 });
  }

  try {
    const halaman = await bacaHalaman(berkas.name, await berkas.arrayBuffer());
    const hasil = await simpanDokumen(berkas.name, halaman);
    return NextResponse.json({ ...hasil, halaman: halaman.length });
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}
