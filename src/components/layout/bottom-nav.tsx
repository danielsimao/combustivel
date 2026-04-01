'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { Map, TrendingUp, BarChart3 } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const tabs = [
    { name: t('nav.forecast'), href: '/', icon: TrendingUp },
    { name: t('nav.map'), href: '/mapa', icon: Map },
    { name: t('nav.statistics'), href: '/estatisticas', icon: BarChart3 },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden">
      <div
        className="mx-auto grid max-w-lg grid-cols-3"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-white'
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
