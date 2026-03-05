'use client';

import React, { useState, useMemo } from 'react';
import { Star, StarHalf, User } from 'lucide-react';
import { Review } from '@/lib/types';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ProductReviewsProps {
  reviews?: Review[];
}

export function ProductReviews({ reviews = [] }: ProductReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(5);

  // Garante que reviews seja sempre um array, mesmo se vier um número do banco de dados (legado)
  const safeReviews = useMemo(() => {
    return Array.isArray(reviews) ? reviews : [];
  }, [reviews]);

  const averageRating = useMemo(() => {
    if (safeReviews.length === 0) return 0;
    const sum = safeReviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / safeReviews.length).toFixed(1));
  }, [safeReviews]);

  const sortedReviews = useMemo(() => {
    return [...safeReviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [safeReviews]);

  const displayedReviews = sortedReviews.slice(0, visibleCount);

  const renderStars = (rating: number, className?: string) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className={cn("h-4 w-4 fill-primary text-primary", className)} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<StarHalf key={i} className={cn("h-4 w-4 fill-primary text-primary", className)} />);
      } else {
        stars.push(<Star key={i} className={cn("h-4 w-4 text-muted-foreground", className)} />);
      }
    }
    return stars;
  };

  return (
    <section className="mt-16 border-t pt-12">
      <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold">Avaliações</h2>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center">
              {renderStars(averageRating, "h-5 w-5")}
            </div>
            <p className="text-lg font-semibold">
              {averageRating > 0 ? `${averageRating} de 5` : "Sem avaliações"}
            </p>
            <p className="text-sm text-muted-foreground">
              ({safeReviews.length} {safeReviews.length === 1 ? "avaliação" : "avaliações"})
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-8">
        {displayedReviews.length > 0 ? (
          <>
            {displayedReviews.map((review) => (
              <div key={review.id} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback>
                        <User className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{review.userName}</p>
                      <div className="flex items-center mt-0.5">
                        {renderStars(review.rating, "h-3 w-3")}
                      </div>
                    </div>
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(review.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </time>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {review.comment}
                </p>
                <Separator className="mt-4" />
              </div>
            ))}

            {visibleCount < safeReviews.length && (
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setVisibleCount(prev => prev + 5)}
                >
                  Ver mais avaliações
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Ainda não há avaliações para este produto.</p>
            <p className="text-sm text-muted-foreground mt-1">Seja o primeiro a avaliar!</p>
          </div>
        )}
      </div>
    </section>
  );
}
