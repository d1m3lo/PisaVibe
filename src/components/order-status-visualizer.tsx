
'use client';

import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/types';
import { Check, Package, Truck, Home, ShoppingCart, Box } from 'lucide-react';

const allStatuses: OrderStatus[] = [
  'Pedido confirmado',
  'Pedido em separação',
  'Pedido em transporte',
  'Saiu para entrega',
  'Pedido entregue',
];

const statusIcons: Record<OrderStatus, React.ElementType> = {
  'Pedido confirmado': Check,
  'Pedido em separação': Box,
  'Pedido em transporte': Truck,
  'Saiu para entrega': Home,
  'Pedido entregue': Package,
};

interface OrderStatusVisualizerProps {
  currentStatus: OrderStatus;
}

export function OrderStatusVisualizer({ currentStatus }: OrderStatusVisualizerProps) {
  const currentIndex = allStatuses.indexOf(currentStatus);

  return (
    <div className="w-full">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-border" />
        <div
          className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500"
          style={{ width: `${(currentIndex / (allStatuses.length - 1)) * 100}%` }}
        />

        {allStatuses.map((status, index) => {
          const isActive = index <= currentIndex;
          const Icon = statusIcons[status];

          return (
            <div key={status} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-500',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p
                className={cn(
                  'mt-2 text-center text-xs font-semibold sm:text-sm',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
