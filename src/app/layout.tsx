import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Combustível - Preços de Combustíveis em Portugal",
  description:
    "Encontre o combustível mais barato perto de si. Preços atualizados, previsões semanais e estatísticas dos postos de abastecimento em Portugal.",
  keywords: [
    "combustível",
    "gasolina",
    "gasóleo",
    "preços",
    "Portugal",
    "postos",
    "previsão",
    "DGEG",
  ],
  openGraph: {
    title: "Combustível - Preços de Combustíveis em Portugal",
    description:
      "Encontre o combustível mais barato perto de si. Previsões semanais e estatísticas.",
    locale: "pt_PT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
