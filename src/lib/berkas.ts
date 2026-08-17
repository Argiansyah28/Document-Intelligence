import { extractText, getDocumentProxy } from "unpdf";

const HURUF_PER_HALAMAN = 3000;

const DIDUKUNG = [".pdf", ".md", ".txt"];

export function didukung(nama: string) {
  return DIDUKUNG.some((akhiran) => nama.toLowerCase().endsWith(akhiran));
}

export function halamanDariTeks(teks: string): string[] {
  const paragraf = teks.split(/\n{2,}/);
  const halaman: string[] = [];
  let sekarang = "";
  for (const bagian of paragraf) {
    if (sekarang.length + bagian.length > HURUF_PER_HALAMAN && sekarang) {
      halaman.push(sekarang);
      sekarang = "";
    }
    sekarang += `${bagian}\n\n`;
  }
  if (sekarang.trim()) halaman.push(sekarang);
  return halaman;
}

export async function bacaHalaman(nama: string, data: ArrayBuffer): Promise<string[]> {
  if (nama.toLowerCase().endsWith(".pdf")) {
    const dokumen = await getDocumentProxy(new Uint8Array(data));
    const { text } = await extractText(dokumen, { mergePages: false });
    return text;
  }
  return halamanDariTeks(new TextDecoder().decode(data));
}
