import type { Sumber } from "./pencarian";

export const PENOLAKAN = "TIDAK DITEMUKAN";

export type Kasus = {
  id: string;
  pertanyaan: string;
  kunci: string[];
  jenis: "terjawab" | "diluar";
};

export type Hasil = {
  id: string;
  pertanyaan: string;
  jawaban: string;
  jenis: Kasus["jenis"];
  retrievalTepat: boolean;
  jawabanBenar: boolean;
  latensi: number;
  token: number;
};

export type Ringkasan = {
  total: number;
  jawabanBenar: number;
  retrievalTepat: number;
  penolakanTepat: number;
  totalPenolakan: number;
  latensiP50: number;
  latensiP95: number;
  tokenTotal: number;
};

function mengandung(teks: string, kunci: string[]) {
  const bawah = teks.toLowerCase();
  return kunci.every((kata) => bawah.includes(kata.toLowerCase()));
}

function menolak(jawaban: string) {
  return jawaban.toUpperCase().includes(PENOLAKAN);
}

export function nilai(
  kasus: Kasus,
  jawaban: string,
  sumber: Sumber[],
  latensi: number,
  token: number,
): Hasil {
  const ditolak = menolak(jawaban);
  return {
    id: kasus.id,
    pertanyaan: kasus.pertanyaan,
    jawaban,
    jenis: kasus.jenis,
    retrievalTepat:
      kasus.jenis === "diluar" ? ditolak : sumber.some((item) => mengandung(item.isi, kasus.kunci)),
    jawabanBenar:
      kasus.jenis === "diluar" ? ditolak : !ditolak && mengandung(jawaban, kasus.kunci),
    latensi,
    token,
  };
}

function persentil(angka: number[], bagian: number) {
  if (!angka.length) return 0;
  const urut = [...angka].sort((a, b) => a - b);
  return urut[Math.min(urut.length - 1, Math.floor(bagian * urut.length))];
}

export function ringkas(hasil: Hasil[]): Ringkasan {
  const latensi = hasil.map((item) => item.latensi);
  const diluar = hasil.filter((item) => item.jenis === "diluar");
  return {
    total: hasil.length,
    jawabanBenar: hasil.filter((item) => item.jawabanBenar).length,
    retrievalTepat: hasil.filter((item) => item.retrievalTepat).length,
    penolakanTepat: diluar.filter((item) => item.jawabanBenar).length,
    totalPenolakan: diluar.length,
    latensiP50: persentil(latensi, 0.5),
    latensiP95: persentil(latensi, 0.95),
    tokenTotal: hasil.reduce((jumlah, item) => jumlah + item.token, 0),
  };
}
