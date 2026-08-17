import { NextResponse } from "next/server";
import { hapusDokumen } from "@/lib/dokumen";

export const runtime = "nodejs";

export async function DELETE(_: Request, konteks: { params: Promise<{ id: string }> }) {
  const { id } = await konteks.params;
  try {
    await hapusDokumen(id);
    return NextResponse.json({ terhapus: true });
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}
