import type { Metadata } from "next";
import Navigasi from "@/components/navigasi";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tanya Dokumen",
  description: "Asisten dokumen internal yang menjawab dengan sitasi halaman",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap"
        />
      </head>
      <body>
        <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 pb-16">
          <Navigasi />
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
