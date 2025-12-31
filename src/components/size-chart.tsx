
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Ruler, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

const sizeData = [
    { size: "P", width: 52, length: 71, sleeve: 23 },
    { size: "M", width: 54, length: 72, sleeve: 24 },
    { size: "G", width: 57, length: 73, sleeve: 25 },
    { size: "GG", width: 58, length: 75, sleeve: 26, highlighted: true },
    { size: "G1", width: 60, length: 77, sleeve: 27, highlighted: true },
    { size: "G2", width: 62, length: 79, sleeve: 28, highlighted: true },
    { size: "G3", width: 64, length: 81, sleeve: 29, highlighted: true },
];


export const SizeChart = () => {
  return (
    <div className="mt-8">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <Ruler className="h-4 w-4"/>
            Tabela de Medidas
        </h3>
        <div className="overflow-x-auto rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="font-bold">Tamanho (BR)</TableHead>
                    <TableHead className="text-center">Largura (cm)</TableHead>
                    <TableHead className="text-center">Comprimento (cm)</TableHead>
                    <TableHead className="text-center">Manga (cm)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sizeData.map((item) => (
                    <TableRow key={item.size} className={cn(item.highlighted && "bg-secondary/50")}>
                        <TableCell className={cn("font-bold", item.highlighted && "text-primary")}>{item.size}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{item.width}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{item.length}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{item.sleeve}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>
                Os tamanhos <span className="font-bold">GG, G1, G2 e G3</span> são indicados para quem prefere roupas mais largas ou possui maior estrutura corporal, oferecendo mais conforto e melhor caimento.
            </p>
        </div>
    </div>
  );
};
