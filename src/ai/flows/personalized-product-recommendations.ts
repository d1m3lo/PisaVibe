'use server';

/**
 * @fileOverview Provides personalized product recommendations based on user history.
 *
 * - getPersonalizedRecommendations - A function to fetch personalized product recommendations.
 * - RecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - RecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendationsInputSchema = z.object({
  userHistory: z
    .string()
    .describe(
      'A string containing the user purchase history, comma separated product ids.'
    ),
  browsingHistory: z
    .string()
    .describe(
      'A string containing the user browsing history, comma separated product ids.'
    ),
});

export type RecommendationsInput = z.infer<typeof RecommendationsInputSchema>;

const RecommendationsOutputSchema = z.object({
  recommendedProducts: z
    .string()
    .describe(
      'A string containing a comma separated list of recommended product ids.'
    ),
});

export type RecommendationsOutput = z.infer<typeof RecommendationsOutputSchema>;

export async function getPersonalizedRecommendations(
  input: RecommendationsInput
): Promise<RecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const personalizedRecommendationsPrompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: RecommendationsInputSchema},
  output: {schema: RecommendationsOutputSchema},
  prompt: `Você é um especialista em recomendação de produtos em uma loja online de tênis e roupas chamada PISA VIBE. O tema da loja é em preto e branco, com alguns tons de cinza.

Com base no histórico de compras e no histórico de navegação do usuário, forneça uma lista de produtos recomendados que ele possa estar interessado em comprar. Os Ids dos produtos devem ser separados por vírgulas.

Histórico de Compras: {{{userHistory}}}
Histórico de Navegação: {{{browsingHistory}}}

Produtos recomendados (IDs separados por vírgulas):`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: RecommendationsInputSchema,
    outputSchema: RecommendationsOutputSchema,
  },
  async input => {
    const {output} = await personalizedRecommendationsPrompt(input);
    return output!;
  }
);
