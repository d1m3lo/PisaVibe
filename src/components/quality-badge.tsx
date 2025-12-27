
import { Award, CheckCircle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";

interface QualityBadgeProps {
    quality?: Product['quality'];
    size?: 'sm' | 'default';
}

export const QualityBadge = ({ quality, size = 'default' }: QualityBadgeProps) => {
    if (!quality) return null;

    const qualityStyles: Record<NonNullable<Product['quality']>, string> = {
        Essential: "bg-green-100 text-green-800 border-green-200",
        Select: "bg-blue-100 text-blue-800 border-blue-200",
        Elite: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    const icon: Record<NonNullable<Product['quality']>, React.ReactNode> = {
        Essential: <CheckCircle className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        Select: <Star className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
        Elite: <Award className={size === 'sm' ? "h-3 w-3" : "h-4 w-4"} />,
    };

    const sizeClasses = size === 'sm' 
        ? 'gap-1 text-xs py-0.5 px-2' 
        : 'gap-2 text-sm py-1 px-3';

    return (
      <Badge variant="outline" className={`${sizeClasses} ${qualityStyles[quality]}`}>
          {icon[quality]}
          {size === 'default' && <span className="font-semibold">Qualidade {quality}</span>}
          {size === 'sm' && <span className="font-semibold">{quality}</span>}
      </Badge>
    );
};
