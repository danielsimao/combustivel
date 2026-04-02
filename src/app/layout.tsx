import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://combustivel-delta.vercel.app"),
  title: {
    default: "Previsão Combustíveis — Gasóleo e Gasolina Sobem ou Descem?",
    template: "%s | Combustível",
  },
  description:
    "Saiba se o gasóleo e a gasolina vão subir ou descer na próxima semana em Portugal. Previsão semanal, mapa de postos e estatísticas de preços.",
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
    siteName: "Combustível",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Combustível",
              url: "https://combustivel-delta.vercel.app",
              description:
                "Previsão semanal dos preços de combustíveis em Portugal. Mapa de postos e estatísticas.",
              inLanguage: "pt",
            }),
          }}
        />
      </head>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Providers>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
