'use server';
/**
 * @fileOverview Generates an image based on the provided text (poem, etc.).
 *
 * - generatePhotoFromPoem - A function that handles the image generation.
 * - GeneratePhotoFromPoemInput - The input type for the function.
 * - GeneratePhotoFromPoemOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePhotoFromPoemInputSchema = z.object({
  poem: z.string().describe('The text (poem, shayari, ghazal) to generate an image from.'),
});
export type GeneratePhotoFromPoemInput = z.infer<typeof GeneratePhotoFromPoemInputSchema>;

const GeneratePhotoFromPoemOutputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The generated photo as a data URI. Format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GeneratePhotoFromPoemOutput = z.infer<typeof GeneratePhotoFromPoemOutputSchema>;

export async function generatePhotoFromPoem(
  input: GeneratePhotoFromPoemInput
): Promise<GeneratePhotoFromPoemOutput> {
  return generatePhotoFromPoemFlow(input);
}

const generatePhotoFromPoemFlow = ai.defineFlow(
  {
    name: 'generatePhotoFromPoemFlow',
    inputSchema: GeneratePhotoFromPoemInputSchema,
    outputSchema: GeneratePhotoFromPoemOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `Generate a beautiful, artistic, and high-quality image that visually represents the mood and content of the following text: "${input.poem}"`,
    });

    if (!media.url) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return {photoDataUri: media.url};
  }
);
