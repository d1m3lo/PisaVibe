
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';

export default function ConditionalHeaderFooter() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admdylondelas');

  if (isAdminPage) {
    return null;
  }

  return <Header />;
}
