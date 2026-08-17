import { hasilkan } from "./gemini";
import { cari, Sumber } from "./pencarian";
import { PENOLAKAN } from "./skor";

export type Jawaban = {
  jawaban: string;
  sumber: Sumber[];
  dipakai: number[];
  latensi: number;
  token: number;
};

function susunPrompt(pertanyaan: string, sumber: Sumber[]) {
  const konteks = sumber
    .map((item, indeks) => `[${indeks + 1}] ${item.dokumen}, halaman ${item.halaman}\n${item.isi}`)
    .join("\n\n");

  return `Kamu asisten dokumen internal perusahaan. Jawab pertanyaan hanya berdasarkan konteks di bawah.

Aturan:
- Gunakan bahasa Indonesia yang ringkas, maksimal empat kalimat.
- Setiap kalimat wajib diakhiri penanda sumber, contoh: [1] atau [2].
- Salin angka, tanggal, dan nominal persis seperti tertulis di konteks.
- Dilarang memakai pengetahuan di luar konteks.
- Jika jawabannya tidak ada di konteks, balas persis: ${PENOLAKAN}

<konteks>
${konteks}
</konteks>

Pertanyaan: ${pertanyaan}`;
}

export async function tanya(pertanyaan: string): Promise<Jawaban> {
  const mulai = Date.now();
  const sumber = await cari(pertanyaan);

  if (!sumber.length) {
    return { jawaban: PENOLAKAN, sumber, dipakai: [], latensi: Date.now() - mulai, token: 0 };
  }

  const { teks, token } = await hasilkan(susunPrompt(pertanyaan, sumber));
  const dipakai = [...new Set([...teks.matchAll(/\[(\d+)\]/g)].map((cocok) => Number(cocok[1])))]
    .filter((nomor) => nomor >= 1 && nomor <= sumber.length)
    .sort((a, b) => a - b);

  return { jawaban: teks, sumber, dipakai, latensi: Date.now() - mulai, token };
}
