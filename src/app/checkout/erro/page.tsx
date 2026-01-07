
import { XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPaymentPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <XCircle className="h-8 w-8" />
          </div>
          <CardTitle className="mt-6 font-headline text-3xl">Falha no Pagamento</CardTitle>
          <CardDescription className="text-lg">
            Não foi possível processar seu pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
                Por favor, verifique os dados do seu cartão ou tente outra forma de pagamento. Se o erro persistir, entre em contato com nosso suporte.
            </p>
            <div className="flex gap-4">
                <Button asChild variant="outline">
                    <Link href="/carrinho">Voltar ao Carrinho</Link>
                </Button>
                <Button asChild>
                    <Link href="/checkout">Tentar Novamente</Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
