import { NextResponse } from "next/server";
import { tanya } from "@/lib/jawaban";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(permintaan: Request) {
  const { pertanyaan } = await permintaan.json();

  if (typeof pertanyaan !== "string" || pertanyaan.trim().length < 3) {
    return NextResponse.json({ galat: "Pertanyaan minimal 3 huruf" }, { status: 400 });
  }

  try {
    return NextResponse.json(await tanya(pertanyaan.trim()));
  } catch (galat) {
    return NextResponse.json({ galat: (galat as Error).message }, { status: 500 });
  }
}
