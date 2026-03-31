import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapa de Postos — Combustível Mais Barato Perto de Si",
  description:
    "Encontre os postos de combustível mais baratos na sua zona. Compare preços de gasóleo e gasolina por distrito, marca e distância.",
  alternates: {
    canonical: "/mapa",
  },
  openGraph: {
    title: "Mapa de Postos de Combustível em Portugal",
    description:
      "Encontre os postos de combustível mais baratos perto de si.",
  },
};

export default function MapaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
