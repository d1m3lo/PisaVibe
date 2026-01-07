
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function PendingPaymentPage() {
  return (
    <div className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <CardTitle className="mt-6 font-headline text-3xl">Pagamento em Processamento</CardTitle>
          <CardDescription className="text-lg">
            Seu pagamento está sendo processado. Você será notificado assim que for aprovado.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <p className="text-muted-foreground">
                Isso pode levar alguns instantes. Você pode acompanhar o status do seu pedido na seção "Meus Pedidos" da sua conta.
            </p>
            <Button asChild className="mt-4">
                <Link href="/minha-conta">Ir para Meus Pedidos</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
