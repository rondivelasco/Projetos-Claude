import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Naming Lab — Workspace Estratégico de Naming",
  description: "Diagnóstico, geração, análise e decisão de naming em um ambiente de trabalho persistente.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
