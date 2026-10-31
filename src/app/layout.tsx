import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calendario · Jose Torres",
  description: "Calendario web con vistas de mes, semana y día, arrastrar y soltar, eventos recurrentes y modo oscuro. Proyecto de portafolio hecho con Next.js y TypeScript.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151b2b" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className={GeistSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
