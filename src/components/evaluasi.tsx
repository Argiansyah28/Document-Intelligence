"use client";

import { useEffect, useState } from "react";
import kasusUji from "@/data/evaluasi.json";
import { Hasil, Kasus, Ringkasan, nilai, ringkas } from "@/lib/skor";

const PARALEL = 3;

type Riwayat = { id: string; ringkasan: Ringkasan; dibuat_pada: string };

const DAFTAR = kasusUji as Kasus[];

function persen(bagian: number, total: number) {
  return total ? Math.round((bagian / total) * 100) : 0;
}

function Angka({ label, nilai: isi, satuan }: { label: string; nilai: number; satuan?: string }) {
  return (
    <div className="border border-garis bg-permukaan px-4 py-3">
      <p className="text-xs uppercase tracking-widest text-samar">{label}</p>
      <p className="mt-1 font-data text-2xl">
        {isi}
        {satuan && <span className="ml-1 text-sm text-samar">{satuan}</span>}
      </p>
    </div>
  );
}

export default function Evaluasi() {
  const [hasil, setHasil] = useState<Hasil[]>([]);
  const [riwayat, setRiwayat] = useState<Riwayat[]>([]);
  const [berjalan, setBerjalan] = useState(false);
  const [galat, setGalat] = useState("");

  async function muatRiwayat() {
    const respons = await fetch("/api/evaluasi");
    const data = await respons.json();
    if (respons.ok) setRiwayat(data);
  }

  useEffect(() => {
    muatRiwayat();
  }, []);

  async function jalankanKasus(kasus: Kasus): Promise<Hasil> {
    const respons = await fetch("/api/tanya", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pertanyaan: kasus.pertanyaan }),
    });
    const data = await respons.json();
    if (!respons.ok) throw new Error(data.galat);
    return nilai(kasus, data.jawaban, data.sumber, data.latensi, data.token);
  }

  async function jalankan() {
    setBerjalan(true);
    setGalat("");
    setHasil([]);

    const terkumpul: Hasil[] = [];
    try {
      for (let i = 0; i < DAFTAR.length; i += PARALEL) {
        const bagian = await Promise.all(DAFTAR.slice(i, i + PARALEL).map(jalankanKasus));
        terkumpul.push(...bagian);
        setHasil([...terkumpul]);
      }
      await fetch("/api/evaluasi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ringkasan: ringkas(terkumpul), rincian: terkumpul }),
      });
      await muatRiwayat();
    } catch (kesalahan) {
      setGalat((kesalahan as Error).message);
    }
    setBerjalan(false);
  }

  const selesai = hasil.length === DAFTAR.length && !berjalan;
  const angka = ringkas(hasil);

  return (
    <div className="py-10">
      <h1 className="font-baca text-3xl">Evaluasi</h1>
      <p className="mt-2 max-w-xl text-sm text-samar">
        {DAFTAR.length} kasus uji dijalankan terhadap dokumen yang tersimpan. Tiga di antaranya
        sengaja menanyakan hal di luar dokumen untuk menguji apakah sistem berani menolak menjawab.
      </p>

      <button
        onClick={jalankan}
        disabled={berjalan}
        className="mt-6 rounded-md bg-aksen px-5 py-3 text-sm font-medium text-permukaan disabled:opacity-50"
      >
        {berjalan ? `Menjalankan ${hasil.length}/${DAFTAR.length}` : "Jalankan evaluasi"}
      </button>

      {galat && <p className="mt-4 text-sm text-bahaya">{galat}</p>}

      {selesai && (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Angka label="Jawaban benar" nilai={persen(angka.jawabanBenar, angka.total)} satuan="%" />
          <Angka
            label="Retrieval tepat"
            nilai={persen(angka.retrievalTepat, angka.total)}
            satuan="%"
          />
          <Angka
            label="Penolakan tepat"
            nilai={persen(angka.penolakanTepat, angka.totalPenolakan)}
            satuan="%"
          />
          <Angka label="Latensi p95" nilai={angka.latensiP95} satuan="ms" />
        </div>
      )}

      {hasil.length > 0 && (
        <table className="mt-8 w-full border border-garis bg-permukaan text-left text-sm">
          <thead className="border-b border-garis font-data text-xs uppercase tracking-widest text-samar">
            <tr>
              <th className="px-4 py-3">Kasus</th>
              <th className="px-4 py-3">Retrieval</th>
              <th className="px-4 py-3">Jawaban</th>
              <th className="px-4 py-3 text-right">Latensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-garis">
            {hasil.map((baris) => (
              <tr key={baris.id}>
                <td className="px-4 py-3">
                  <p>{baris.pertanyaan}</p>
                  <p className="mt-1 font-data text-xs text-samar">{baris.id}</p>
                </td>
                <td className="px-4 py-3">{baris.retrievalTepat ? "tepat" : "meleset"}</td>
                <td className={baris.jawabanBenar ? "px-4 py-3" : "px-4 py-3 text-bahaya"}>
                  {baris.jawabanBenar ? "benar" : "salah"}
                </td>
                <td className="px-4 py-3 text-right font-data text-xs">{baris.latensi} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {riwayat.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-samar">Riwayat</h2>
          <ul className="mt-4 divide-y divide-garis border border-garis bg-permukaan">
            {riwayat.map((item) => (
              <li key={item.id} className="flex justify-between px-4 py-3 font-data text-xs">
                <span className="text-samar">
                  {new Date(item.dibuat_pada).toLocaleString("id-ID")}
                </span>
                <span>
                  {persen(item.ringkasan.jawabanBenar, item.ringkasan.total)}% benar ·{" "}
                  {item.ringkasan.latensiP95} ms p95 · {item.ringkasan.tokenTotal} token
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
