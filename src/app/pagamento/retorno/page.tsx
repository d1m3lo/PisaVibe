
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle } from 'lucide-react';

export default function PagamentoRetornoPage() {
  const router = useRouter();
  const [isNightTime, setIsNightTime] = useState(false);

  useEffect(() => {
    const currentHour = new Date().getHours();
    // From 00:00 (midnight) to 06:59
    if (currentHour >= 0 && currentHour < 7) {
        setIsNightTime(true);
    }

    const timer = setTimeout(() => {
      router.replace('/minha-conta');
    }, 10000); // 10 segundos de espera

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        {isNightTime ? (
            <>
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h1 className="text-2xl font-semibold">Compra finalizada com sucesso.</h1>
                <p className="text-muted-foreground max-w-lg">
                    Recebemos seu pedido normalmente. Como a compra foi feita durante a madrugada, a validação do pagamento será feita a partir das 07:00 da manhã. Pode ficar tranquilo(a), assim que for validado o pedido aparece normalmente no sistema.
                </p>
                <p className="text-sm text-muted-foreground mt-4">Você será redirecionado em instantes...</p>
            </>
        ) : (
            <>
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Processando retorno...</h1>
                <p className="text-muted-foreground">
                    Você será redirecionado em instantes.
                </p>
            </>
        )}
    </div>
  );
}
