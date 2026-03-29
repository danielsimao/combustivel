export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-500">
            Dados fornecidos pela{' '}
            <a
              href="https://precoscombustiveis.dgeg.gov.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              DGEG
            </a>
            {' '}e{' '}
            <a
              href="https://www.ense-epe.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              ENSE
            </a>
            . Uso não comercial.
          </p>
          <p className="text-xs text-zinc-400">
            Os preços são atualizados pelos postos de abastecimento.
          </p>
        </div>
      </div>
    </footer>
  );
}
