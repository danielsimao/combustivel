'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Fuel, Map, TrendingUp, BarChart3, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const navigation = [
  { name: 'Mapa', href: '/', icon: Map },
  { name: 'Previsão', href: '/previsao', icon: TrendingUp },
  { name: 'Estatísticas', href: '/estatisticas', icon: BarChart3 },
  { name: 'Sobre', href: '/sobre', icon: Fuel },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Fuel className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight text-zinc-900 dark:text-white">
              Combustível
            </span>
            <span className="text-[10px] leading-tight text-zinc-500">
              Preços em Portugal
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile drawer */}
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menu de navegação"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Navegação</DrawerTitle>
            </DrawerHeader>
            <nav className="flex flex-col gap-1 px-4 pb-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <DrawerClose key={item.href} asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </DrawerClose>
                );
              })}
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
