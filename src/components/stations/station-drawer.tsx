'use client';

import { useEffect, useState } from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { Station } from '@/types';
import { StationDetail } from './station-detail';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useTranslation } from '@/lib/i18n';
import { X } from 'lucide-react';

interface StationDrawerProps {
  station: Station | null;
  onClose: () => void;
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

export function StationDrawer({ station, onClose }: StationDrawerProps) {
  const isOpen = station !== null;
  const isDesktop = useIsDesktop();
  const { t } = useTranslation();

  if (!isOpen) return null;

  // Desktop: right panel, no overlay, map stays interactive
  if (isDesktop) {
    return (
      <DrawerPrimitive.Root
        direction="right"
        open={isOpen}
        onOpenChange={(open) => !open && onClose()}
        modal={false}
      >
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Content
            className="fixed right-0 top-16 bottom-0 z-50 flex w-[400px] flex-col border-l border-zinc-200 bg-white shadow-xl outline-none dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-500">{t('station.details')}</span>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <StationDetail station={station} />
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    );
  }

  // Mobile: bottom sheet with overlay
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{station.Nome}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-8 pt-2">
          <StationDetail station={station} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
