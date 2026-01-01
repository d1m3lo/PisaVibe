"use client";

import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import CheckoutContent from './CheckoutContent';

const CheckoutPageSkeleton = () => (
    <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <Skeleton className="h-4 w-24" />
                               <Skeleton className="h-10 w-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                         <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-7 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Separator />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <div className="flex gap-2">
                              <Skeleton className="h-10 flex-grow" />
                              <Skeleton className="h-10 w-24" />
                          </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-5 w-1/3" />
                        </div>
                         <div className="flex justify-between">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);


export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutPageSkeleton />}>
        <CheckoutContent />
    </Suspense>
  );
}
