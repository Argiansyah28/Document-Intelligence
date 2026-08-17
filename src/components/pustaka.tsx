"use client";

import { useEffect, useRef, useState } from "react";
import type { Dokumen } from "@/lib/dokumen";

export default function Pustaka() {
  const [dokumen, setDokumen] = useState<Dokumen[]>([]);
  const [galat, setGalat] = useState("");
  const [memproses, setMemproses] = useState(false);
  const masukan = useRef<HTMLInputElement>(null);

  async function muat() {
    const respons = await fetch("/api/dokumen");
    const data = await respons.json();
    if (respons.ok) setDokumen(data);
    else setGalat(data.galat);
  }

  useEffect(() => {
    muat();
  }, []);

  async function unggah(berkas: File) {
    setMemproses(true);
    setGalat("");

    const muatan = new FormData();
    muatan.append("berkas", berkas);
    const respons = await fetch("/api/dokumen", { method: "POST", body: muatan });
    const data = await respons.json();

    if (respons.ok) await muat();
    else setGalat(data.galat);
    setMemproses(false);
    if (masukan.current) masukan.current.value = "";
  }

  async function hapus(id: string) {
    await fetch(`/api/dokumen/${id}`, { method: "DELETE" });
    await muat();
  }

  return (
    <div className="py-10">
      <h1 className="font-baca text-3xl">Dokumen</h1>
      <p className="mt-2 max-w-xl text-sm text-samar">
        Unggah PDF, Markdown, atau teks. Isinya dipotong per bagian, diubah jadi vektor, lalu
        disimpan bersama nomor halamannya supaya sitasi tetap bisa ditelusuri.
      </p>

      <label className="mt-8 flex cursor-pointer items-center justify-between gap-4 border border-dashed border-garis bg-permukaan px-5 py-6">
        <span className="text-sm text-samar">
          {memproses ? "Memproses dokumen, mohon tunggu" : "Pilih berkas PDF, MD, atau TXT (maks 8 MB)"}
        </span>
        <span className="rounded-md bg-aksen px-4 py-2 text-sm text-permukaan">Pilih berkas</span>
        <input
          ref={masukan}
          type="file"
          accept=".pdf,.md,.txt"
          disabled={memproses}
          onChange={(kejadian) => {
            const berkas = kejadian.target.files?.[0];
            if (berkas) unggah(berkas);
          }}
          className="hidden"
        />
      </label>

      {galat && <p className="mt-4 text-sm text-bahaya">{galat}</p>}

      <ul className="mt-8 divide-y divide-garis border border-garis bg-permukaan">
        {dokumen.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-sm">{item.nama}</p>
              <p className="font-data text-xs text-samar">
                {item.halaman} halaman · {item.jumlahPotongan} potongan
              </p>
            </div>
            <button
              onClick={() => hapus(item.id)}
              className="text-xs text-samar hover:text-bahaya"
            >
              Hapus
            </button>
          </li>
        ))}
        {!dokumen.length && (
          <li className="px-5 py-8 text-sm text-samar">
            Belum ada dokumen. Jalankan npm run db:seed untuk memuat contoh peraturan perusahaan.
          </li>
        )}
      </ul>
    </div>
  );
}
