import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const sql = db();
    const baris = await sql`
      select id, ringkasan, dibuat_pada
      from evaluasi
      order by dibuat_pada desc
      limit 10
    `;
    return NextResponse.json(baris);
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}

export async function POST(permintaan: Request) {
  const { ringkasan, rincian } = await permintaan.json();

  if (!ringkasan || !Array.isArray(rincian)) {
    return NextResponse.json({ galat: "Data evaluasi tidak lengkap" }, { status: 400 });
  }

  try {
    const sql = db();
    await sql`
      insert into evaluasi (ringkasan, rincian)
      values (${JSON.stringify(ringkasan)}, ${JSON.stringify(rincian)})
    `;
    return NextResponse.json({ tersimpan: true });
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}
