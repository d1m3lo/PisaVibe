"use server";

import { getPersonalizedRecommendations } from "@/ai/flows/personalized-product-recommendations";
import { products } from "./products";

export async function getRecommendationsAction() {
  try {
    // In a real application, you would fetch this data from your user database
    const simulatedUserHistory = {
      userHistory: "1,5", // User bought Vibe Runner and Minimal T-shirt
      browsingHistory: "2,6,7", // User looked at Classic White, Vibe T-shirt, and Essential Hoodie
    };

    const recommendations = await getPersonalizedRecommendations(
      simulatedUserHistory
    );
    const recommendedIds = recommendations.recommendedProducts.split(",");

    const recommendedProducts = products.filter((p) =>
      recommendedIds.includes(p.id)
    );

    // Ensure we always return a consistent number of products if possible
    if (recommendedProducts.length < 4) {
      const additionalProducts = products
        .filter(p => !recommendedIds.includes(p.id))
        .slice(0, 4 - recommendedProducts.length);
      return [...recommendedProducts, ...additionalProducts];
    }
    
    return recommendedProducts.slice(0, 4);

  } catch (error) {
    console.error("Error getting recommendations:", error);
    // Fallback to a default list of popular products
    return products.slice(4, 8);
  }
}
