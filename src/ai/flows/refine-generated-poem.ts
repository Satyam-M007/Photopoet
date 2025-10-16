'use server';
/**
 * @fileOverview An AI agent that refines a generated poem based on user feedback.
 *
 * - refineGeneratedPoem - A function that refines a generated poem.
 * - RefineGeneratedPoemInput - The input type for the refineGeneratedPoem function.
 * - RefineGeneratedPoemOutput - The return type for the refineGeneratedPoem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineGeneratedPoemInputSchema = z.object({
  originalPoem: z.string().describe('The original generated poem.'),
  feedback: z.string().describe('The user feedback on the poem.'),
});
export type RefineGeneratedPoemInput = z.infer<typeof RefineGeneratedPoemInputSchema>;

const RefineGeneratedPoemOutputSchema = z.object({
  refinedPoem: z.string().describe('The refined poem based on the user feedback.'),
});
export type RefineGeneratedPoemOutput = z.infer<typeof RefineGeneratedPoemOutputSchema>;

export async function refineGeneratedPoem(input: RefineGeneratedPoemInput): Promise<RefineGeneratedPoemOutput> {
  const result = await refineGeneratedPoemFlow(input);
  return {
    refinedPoem: `${result.refinedPoem}\n\n~Satyam mishra`,
  };
}

const prompt = ai.definePrompt({
  name: 'refineGeneratedPoemPrompt',
  input: {schema: RefineGeneratedPoemInputSchema},
  output: {schema: RefineGeneratedPoemOutputSchema},
  prompt: `You are a helpful and empathetic AI assistant that refines poems based on user feedback. Your goal is to make the poem feel more human and emotionally resonant.

  Incorporate the user's feedback while maintaining a natural, heartfelt tone. Ensure the refined poem is formatted with appropriate line breaks for readability and artistic presentation.

  Original Poem: {{{originalPoem}}}
  Feedback: {{{feedback}}}

  Refined Poem:`,
});

const refineGeneratedPoemFlow = ai.defineFlow(
  {
    name: 'refineGeneratedPoemFlow',
    inputSchema: RefineGeneratedPoemInputSchema,
    outputSchema: RefineGeneratedPoemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
