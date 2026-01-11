
import { Suspense } from 'react';
import PendingRedirectContent from './PendingRedirectContent';
import { Loader2 } from 'lucide-react';

const PendingRedirectSkeleton = () => (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 py-12">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Processando informações do pagamento...</p>
    </div>
);


export default function PendingPaymentPage() {
  return (
    <Suspense fallback={<PendingRedirectSkeleton />}>
        <PendingRedirectContent />
    </Suspense>
  );
}
