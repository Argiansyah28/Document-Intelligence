const UKURAN = 800;
const TINDIH = 150;

export type Potongan = { halaman: number; urutan: number; isi: string };

function akhirKalimat(teks: string, mulai: number) {
  const batas = Math.min(mulai + UKURAN, teks.length);
  if (batas === teks.length) return batas;
  const titik = teks.lastIndexOf(". ", batas);
  return titik > mulai + UKURAN / 2 ? titik + 1 : batas;
}

export function potong(halaman: string[]): Potongan[] {
  const hasil: Potongan[] = [];
  halaman.forEach((teks, indeks) => {
    const bersih = teks.replace(/\s+/g, " ").trim();
    let mulai = 0;
    while (mulai < bersih.length) {
      const batas = akhirKalimat(bersih, mulai);
      const isi = bersih.slice(mulai, batas).trim();
      if (isi.length > 40) {
        hasil.push({ halaman: indeks + 1, urutan: hasil.length, isi });
      }
      if (batas >= bersih.length) break;
      mulai = batas - TINDIH;
    }
  });
  return hasil;
}
