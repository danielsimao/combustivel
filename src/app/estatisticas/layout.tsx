import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estatísticas de Preços de Combustíveis em Portugal",
  description:
    "Evolução histórica dos preços de gasóleo e gasolina em Portugal. Gráficos com dados da DGEG atualizados diariamente.",
  alternates: {
    canonical: "/estatisticas",
  },
  openGraph: {
    title: "Estatísticas de Preços de Combustíveis",
    description:
      "Evolução histórica dos preços de gasóleo e gasolina em Portugal.",
  },
};

export default function EstatisticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
