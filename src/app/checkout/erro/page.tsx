
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CheckoutErrorContent from './CheckoutErrorContent';
import { Loader2 } from 'lucide-react';

const CheckoutErrorSkeleton = () => (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Processando informações do pagamento...</p>
    </div>
);

export default function ErrorPaymentPage() {
  return (
    <Suspense fallback={<CheckoutErrorSkeleton />}>
        <CheckoutErrorContent />
    </Suspense>
  );
}
