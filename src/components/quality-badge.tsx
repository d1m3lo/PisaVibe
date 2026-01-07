
import { Gem, CheckCircle, Star, Diamond } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

interface QualityBadgeProps {
    quality?: Product['quality'];
    size?: 'sm' | 'default';
}

const qualityDescriptions: Record<NonNullable<Product['quality']>, string> = {
    Essential: "Qualidade essencial, pensada para o dia a dia com ótimo custo-benefício.",
    Select: "Qualidade selecionada, com materiais e acabamento de alto padrão.",
    Elite: "Qualidade elite. O melhor nível disponível, com fidelidade máxima nos detalhes.",
    Ultra: "Qualidade Ultra. A perfeição em cada detalhe, para os mais exigentes.",
};

export const QualityBadge = ({ quality, size = 'default' }: QualityBadgeProps) => {
    if (!quality) return null;

    const qualityStyles: Record<NonNullable<Product['quality']>, string> = {
        Essential: "bg-green-100 text-green-800 border-green-200",
        Select: "bg-blue-100 text-blue-800 border-blue-200",
        Elite: "bg-purple-100 text-purple-800 border-purple-200",
        Ultra: "bg-cyan-100 text-cyan-800 border-cyan-300",
    };

    const icon: Record<NonNullable<Product['quality']>, React.ReactNode> = {
        Essential: <CheckCircle className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        Select: <Star className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        Elite: <Gem className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        Ultra: <Diamond className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
    };

    const sizeClasses = size === 'sm' 
        ? 'gap-1 text-xs py-0.5 px-2' 
        : 'gap-2 text-sm py-1 px-3';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger>
                    <Badge variant="outline" className={`select-none ${sizeClasses} ${qualityStyles[quality]}`}>
                        {icon[quality]}
                        <span className="font-semibold">{quality}</span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{qualityDescriptions[quality]}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
