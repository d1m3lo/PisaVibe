
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Esta página agora apenas redireciona
export default function SuccessPaymentRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redireciona para a página de retorno principal, passando os parâmetros
    const params = new URLSearchParams(searchParams.toString());
    router.replace(`/pagamento/retorno?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      <p className="text-muted-foreground">Processando informações do pagamento...</p>
    </div>
  );
}
