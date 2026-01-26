import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";

const font = Manrope({ subsets: ["latin"], variable: "--font-display" });
const siteBaseUrl = process.env.SITE_BASE_URL || "https://medicos-test.ctrls.dev.br";

export const metadata: Metadata = {
  title: "Inovare – Médicos",
  description: "Conheça o corpo clínico da Inovare – Serviços de Saúde.",
  metadataBase: new URL(siteBaseUrl),
  icons: {
    icon: "/Logo.png"
  },
  openGraph: {
    title: "Inovare – Médicos",
    description: "Conheça o corpo clínico da Inovare – Serviços de Saúde.",
    type: "website",
    url: siteBaseUrl,
    siteName: "Inovare – Serviços de Saúde"
  }
};

export const viewport: Viewport = {
  themeColor: "#f5ab4d"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={font.variable}>{children}</body>
    </html>
  );
}
