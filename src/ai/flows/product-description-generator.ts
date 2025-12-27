'use server';

/**
 * @fileOverview Flow to generate product descriptions based on a product title and keywords.
 *
 * - generateProductDescription - Function to generate the product description.
 * - ProductDescriptionInput - Input type for the generateProductDescription function.
 * - ProductDescriptionOutput - Return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductDescriptionInputSchema = z.object({
  title: z.string().describe('The title of the product.'),
  keywords: z.string().describe('Keywords describing the product, separated by commas.'),
});

export type ProductDescriptionInput = z.infer<typeof ProductDescriptionInputSchema>;

const ProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated product description.'),
});

export type ProductDescriptionOutput = z.infer<typeof ProductDescriptionOutputSchema>;

export async function generateProductDescription(
  input: ProductDescriptionInput
): Promise<ProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productDescriptionPrompt',
  input: {schema: ProductDescriptionInputSchema},
  output: {schema: ProductDescriptionOutputSchema},
  prompt: `Você é um especialista em marketing e copywriting. Sua tarefa é criar descrições de produtos atraentes e informativas para uma loja online chamada PISA VIBE, que vende tênis e roupas. O estilo da loja é minimalista, em preto e branco, com alguns tons de cinza. Todas as descrições devem ser em português.

Com base no título e nas palavras-chave fornecidas, gere uma descrição detalhada do produto que destaque seus principais recursos e benefícios. Use uma linguagem persuasiva para incentivar os clientes a comprar o produto.

Título do produto: {{{title}}}
Palavras-chave: {{{keywords}}}

Descrição:`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: ProductDescriptionInputSchema,
    outputSchema: ProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

