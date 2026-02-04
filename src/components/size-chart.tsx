
'use client';

import { Info, Ruler } from 'lucide-react';
import { cn } from "@/lib/utils";

const sizeData = [
    { size: "P", width: 52, length: 71, sleeve: 23 },
    { size: "M", width: 54, length: 72, sleeve: 24 },
    { size: "G", width: 57, length: 73, sleeve: 25 },
    { size: "GG", width: 58, length: 75, sleeve: 26 },
];

interface SizeChartProps {
  selectedSize: string | null;
}

export const SizeChart = ({ selectedSize }: SizeChartProps) => {
    const measurements = sizeData.find(s => s.size === selectedSize);

    return (
        <div className="mt-8 space-y-4">
            <div className="min-h-[96px]">
                {measurements && (
                    <div className="space-y-2 rounded-lg border bg-secondary/50 p-4 animate-in fade-in-50">
                        <h4 className="flex items-center gap-2 text-sm font-semibold">
                            <Ruler className="h-4 w-4" />
                            Medidas para o tamanho {selectedSize}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-xs text-muted-foreground">Largura</p>
                                <p className="font-bold">{measurements.width} cm</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Comprimento</p>
                                <p className="font-bold">{measurements.length} cm</p>
                            </div>
                             <div>
                                <p className="text-xs text-muted-foreground">Manga</p>
                                <p className="font-bold">{measurements.sleeve} cm</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                    O tamanho <span className="font-bold">GG</span> é indicado para quem prefere roupas mais largas ou possui maior estrutura corporal, oferecendo mais conforto e melhor caimento.
                </p>
            </div>
        </div>
    );
};

    
