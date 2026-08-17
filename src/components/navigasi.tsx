"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TAUTAN = [
  { href: "/", label: "Tanya" },
  { href: "/dokumen", label: "Dokumen" },
  { href: "/evaluasi", label: "Evaluasi" },
];

export default function Navigasi() {
  const jalur = usePathname();

  return (
    <header className="flex flex-col gap-4 border-b border-garis py-6 sm:flex-row sm:items-baseline sm:justify-between">
      <Link href="/" className="text-lg font-semibold tracking-tight">
        Tanya Dokumen
      </Link>
      <nav className="flex gap-6 text-sm">
        {TAUTAN.map((tautan) => (
          <Link
            key={tautan.href}
            href={tautan.href}
            className={
              jalur === tautan.href
                ? "border-b-2 border-aksen pb-1 text-aksen"
                : "border-b-2 border-transparent pb-1 text-samar hover:text-tinta"
            }
          >
            {tautan.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
