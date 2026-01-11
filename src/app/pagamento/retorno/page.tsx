
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PagamentoRetornoPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/minha-conta');
    }, 2000); // 2 segundos de espera

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      <h1 className="text-2xl font-semibold">Processando retorno...</h1>
      <p className="text-muted-foreground">
        Você será redirecionado em instantes.
      </p>
    </div>
  );
}
