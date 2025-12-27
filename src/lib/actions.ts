"use server";

import { getPersonalizedRecommendations } from "@/ai/flows/personalized-product-recommendations";
import { collection, getDocs, Firestore, query, where, limit } from 'firebase/firestore';
import { getSdks } from "@/firebase";
import type { Product } from "./types";

async function getProductsFromFirestore(ids?: string[]): Promise<Product[]> {
    const { firestore } = getSdks();
    const productsRef = collection(firestore as Firestore, 'products');
    
    let q;
    if (ids && ids.length > 0) {
        q = query(productsRef, where('id', 'in', ids), where('status', '==', 'ativo'));
    } else {
        q = query(productsRef, where('status', '==', 'ativo'), limit(8));
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => doc.data() as Product);
}

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
    const recommendedIds = recommendations.recommendedProducts.split(",").map(id => id.trim());

    let recommendedProducts = await getProductsFromFirestore(recommendedIds);

    // Ensure we always return a consistent number of products if possible
    if (recommendedProducts.length < 4) {
      const fallbackProducts = await getProductsFromFirestore();
      const additionalProducts = fallbackProducts
        .filter(p => !recommendedIds.includes(p.id))
        .slice(0, 4 - recommendedProducts.length);
      return [...recommendedProducts, ...additionalProducts];
    }
    
    return recommendedProducts.slice(0, 4);

  } catch (error) {
    console.error("Error getting recommendations:", error);
    // Fallback to a default list of popular products
    return getProductsFromFirestore();
  }
}
