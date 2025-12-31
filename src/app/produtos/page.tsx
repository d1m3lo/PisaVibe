
import { Suspense } from 'react';
import ProductsContent from './ProductsContent';
import { Skeleton } from '@/components/ui/skeleton';

const ProductsPageSkeleton = () => (
    <div className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:flex-row">
            <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[300px] w-full rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsContent />
    </Suspense>
  );
}
