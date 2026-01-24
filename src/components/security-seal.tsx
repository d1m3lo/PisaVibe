'use client';

import { ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SecuritySealProps {
  className?: string;
  variant?: 'full' | 'compact';
}

export const SecuritySeal = ({ className, variant = 'full' }: SecuritySealProps) => {
  const content = (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <ShieldCheck className={cn("shrink-0 text-green-600", variant === 'full' ? "h-5 w-5" : "h-4 w-4")} />
      {variant === 'full' && <span className="font-semibold text-sm">Compra Segura & Qualidade Garantida</span>}
    </div>
  );
  
  if (variant === 'compact') {
      return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="cursor-help w-fit">
                        {content}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Compra Segura & Qualidade Garantida</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
  }
  
  return content;
};
