"use client";

import { useState } from "react";
import type { Jawaban } from "@/lib/jawaban";
import { PENOLAKAN } from "@/lib/skor";

const CONTOH = [
  "Berapa hari cuti tahunan saya?",
  "Bagaimana perhitungan upah lembur?",
  "Berapa batas waktu klaim kesehatan?",
];

function keSumber(nomor: number) {
  document.getElementById(`sumber-${nomor}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function Teks({ isi }: { isi: string }) {
  return (
    <p className="font-baca text-lg leading-relaxed">
      {isi.split(/(\[\d+\])/g).map((bagian, indeks) => {
        const cocok = bagian.match(/^\[(\d+)\]$/);
        if (!cocok) return <span key={indeks}>{bagian}</span>;
        return (
          <button
            key={indeks}
            onClick={() => keSumber(Number(cocok[1]))}
            className="mx-0.5 rounded-sm bg-stabilo px-1.5 font-data text-xs align-super hover:bg-aksen hover:text-permukaan"
          >
            {cocok[1]}
          </button>
        );
      })}
    </p>
  );
}

export default function Tanya() {
  const [pertanyaan, setPertanyaan] = useState("");
  const [hasil, setHasil] = useState<Jawaban | null>(null);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);

  async function kirim(isi: string) {
    if (isi.trim().length < 3 || memuat) return;
    setMemuat(true);
    setGalat("");
    setHasil(null);

    const respons = await fetch("/api/tanya", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pertanyaan: isi }),
    });
    const data = await respons.json();

    if (respons.ok) setHasil(data);
    else setGalat(data.galat);
    setMemuat(false);
  }

  const ditolak = hasil?.jawaban.toUpperCase().includes(PENOLAKAN);

  return (
    <div className="py-10">
      <h1 className="max-w-xl font-baca text-3xl leading-snug">
        Tanya apa pun tentang dokumen internal, jawabannya selalu menyebut halaman sumbernya.
      </h1>

      <form
        onSubmit={(kejadian) => {
          kejadian.preventDefault();
          kirim(pertanyaan);
        }}
        className="mt-8 flex gap-2"
      >
        <input
          value={pertanyaan}
          onChange={(kejadian) => setPertanyaan(kejadian.target.value)}
          placeholder="Contoh: berapa hari cuti tahunan saya?"
          className="flex-1 rounded-md border border-garis bg-permukaan px-4 py-3 text-base placeholder:text-samar"
        />
        <button
          type="submit"
          disabled={memuat}
          className="rounded-md bg-aksen px-5 py-3 text-sm font-medium text-permukaan disabled:opacity-50"
        >
          {memuat ? "Mencari" : "Tanya"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {CONTOH.map((isi) => (
          <button
            key={isi}
            onClick={() => {
              setPertanyaan(isi);
              kirim(isi);
            }}
            className="rounded-full border border-garis px-3 py-1 text-xs text-samar hover:border-aksen hover:text-aksen"
          >
            {isi}
          </button>
        ))}
      </div>

      {galat && <p className="mt-8 text-sm text-bahaya">{galat}</p>}

      {hasil && (
        <section className="mt-10">
          <article className="border-l-2 border-aksen bg-permukaan px-6 py-5">
            {ditolak ? (
              <p className="font-baca text-lg text-samar">
                Jawabannya tidak ada di dokumen yang tersimpan. Coba ubah kata kunci, atau unggah
                dokumen yang memuat informasi tersebut.
              </p>
            ) : (
              <Teks isi={hasil.jawaban} />
            )}
          </article>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-data text-xs text-samar">
            <div>
              <dt className="inline">latensi </dt>
              <dd className="inline text-tinta">{hasil.latensi} ms</dd>
            </div>
            <div>
              <dt className="inline">token </dt>
              <dd className="inline text-tinta">{hasil.token}</dd>
            </div>
            <div>
              <dt className="inline">potongan diambil </dt>
              <dd className="inline text-tinta">{hasil.sumber.length}</dd>
            </div>
            <div>
              <dt className="inline">disitasi </dt>
              <dd className="inline text-tinta">{hasil.dipakai.length}</dd>
            </div>
          </dl>

          {hasil.sumber.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xs uppercase tracking-widest text-samar">Sumber</h2>
              <ol className="mt-4 space-y-3">
                {hasil.sumber.map((sumber, indeks) => {
                  const nomor = indeks + 1;
                  const dipakai = hasil.dipakai.includes(nomor);
                  return (
                    <li
                      key={sumber.id}
                      id={`sumber-${nomor}`}
                      className={
                        dipakai
                          ? "border border-garis bg-permukaan p-4"
                          : "border border-garis bg-permukaan p-4 opacity-50"
                      }
                    >
                      <div className="flex items-baseline gap-3 font-data text-xs text-samar">
                        <span
                          className={
                            dipakai
                              ? "rounded-sm bg-stabilo px-1.5 text-tinta"
                              : "rounded-sm border border-garis px-1.5"
                          }
                        >
                          {nomor}
                        </span>
                        <span>
                          {sumber.dokumen} · halaman {sumber.halaman}
                        </span>
                      </div>
                      <p className="mt-2 font-baca text-sm leading-relaxed text-samar">
                        {sumber.isi}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
