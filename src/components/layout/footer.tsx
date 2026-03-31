'use client';

import { useTranslation } from '@/lib/i18n';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="hidden border-t border-zinc-200 bg-zinc-50 md:block dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-500">
            {t('footer.dataBy')}{' '}
            <a
              href="https://precoscombustiveis.dgeg.gov.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              DGEG
            </a>
            {' '}{t('footer.and')}{' '}
            <a
              href="https://www.ense-epe.pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              ENSE
            </a>
            . {t('footer.nonCommercial')}
          </p>
          <p className="text-xs text-zinc-400">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  );
}
