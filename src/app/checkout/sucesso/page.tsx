
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SuccessPaymentPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="mt-6 font-headline text-3xl">Pagamento Aprovado!</CardTitle>
          <CardDescription className="text-lg">
            Seu pedido foi confirmado e já está sendo preparado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
                Obrigado por comprar na PISA VIBE! Você pode acompanhar o status do seu pedido na sua conta.
            </p>
            <Button asChild className="mt-4">
                <Link href="/minha-conta">Acompanhar Meu Pedido</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
