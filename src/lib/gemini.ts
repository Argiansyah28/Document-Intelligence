const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_EMBEDDING = process.env.MODEL_EMBEDDING ?? "gemini-embedding-001";
const MODEL_JAWABAN = process.env.MODEL_JAWABAN ?? "gemini-3.6-flash";
const DIMENSI = 768;
const PARALEL = 4;
const PERCOBAAN = 3;

export type Tugas = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

function kunci() {
  const nilai = process.env.GOOGLE_API_KEY;
  if (!nilai) throw new Error("GOOGLE_API_KEY belum diisi di file .env");
  return nilai;
}

function jeda(milidetik: number) {
  return new Promise((lanjut) => setTimeout(lanjut, milidetik));
}

async function panggil(jalur: string, badan: unknown, percobaan = 1): Promise<any> {
  const respons = await fetch(`${BASE}/${jalur}?key=${kunci()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(badan),
  });

  if (respons.status === 429 && percobaan < PERCOBAAN) {
    await jeda(percobaan * 2000);
    return panggil(jalur, badan, percobaan + 1);
  }
  if (respons.status === 404) {
    throw new Error(
      `Model "${jalur.split(":")[0]}" tidak tersedia untuk API key ini. ` +
        `Jalankan npm run model untuk melihat daftar model yang bisa kamu pakai, ` +
        `lalu isi MODEL_JAWABAN atau MODEL_EMBEDDING di file .env`,
    );
  }
  if (!respons.ok) {
    throw new Error(`Gemini menolak permintaan (${respons.status}): ${await respons.text()}`);
  }
  return respons.json();
}

async function satuEmbedding(teks: string, tugas: Tugas): Promise<number[]> {
  const data = await panggil(`${MODEL_EMBEDDING}:embedContent`, {
    model: `models/${MODEL_EMBEDDING}`,
    content: { parts: [{ text: teks }] },
    taskType: tugas,
    outputDimensionality: DIMENSI,
  });
  return data.embedding.values;
}

export async function embedding(teks: string[], tugas: Tugas): Promise<number[][]> {
  const hasil: number[][] = [];
  for (let i = 0; i < teks.length; i += PARALEL) {
    const bagian = teks.slice(i, i + PARALEL);
    hasil.push(...(await Promise.all(bagian.map((isi) => satuEmbedding(isi, tugas)))));
  }
  return hasil;
}

export async function hasilkan(prompt: string) {
  const data = await panggil(`${MODEL_JAWABAN}:generateContent`, {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingLevel: "low" },
    },
  });

  const kandidat = data.candidates?.[0];
  const teks: string = (kandidat?.content?.parts ?? [])
    .filter((bagian: any) => bagian.text && !bagian.thought)
    .map((bagian: any) => bagian.text)
    .join("")
    .trim();

  if (!teks) throw new Error(`Jawaban kosong, alasan berhenti: ${kandidat?.finishReason}`);

  return { teks, token: data.usageMetadata?.totalTokenCount ?? 0 };
}