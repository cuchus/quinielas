import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionBar from "@/components/SessionBar"; // 👈 importar la barra

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NFL Quinielas",
  description: "App de quinielas NFL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* 🔹 Barra de sesión global */}
        <SessionBar />

        {/* 🔹 Contenido de cada página */}
        <main className="max-w-6xl mx-auto py-6 px-4">
          {children}
        </main>
      </body>
    </html>
  );
}
