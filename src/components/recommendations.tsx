"use client";

import React, { useState, useEffect } from "react";
import { ProductCard } from "./product-card";
import { getRecommendationsAction } from "@/lib/actions";
import type { Product } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";

export default function Recommendations() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const products = await getRecommendationsAction();
        setRecommendedProducts(products);
      } catch (error) {
        console.error("Failed to fetch recommendations", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <section className="w-full bg-secondary py-16 md:py-24">
      <div className="container mx-auto px-4">
        <h2 className="mb-10 text-center font-headline text-3xl font-bold md:text-4xl">
          Recomendado para Você
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[300px] w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            : recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
