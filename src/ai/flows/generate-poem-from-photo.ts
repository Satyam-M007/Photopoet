'use server';

/**
 * @fileOverview Generates a unique poem based on the content and mood of an uploaded photo.
 *
 * - generatePoemFromPhoto - A function that generates a poem from a photo.
 * - GeneratePoemFromPhotoInput - The input type for the generatePoemFromPhoto function.
 * - GeneratePoemFromPhotoOutput - The return type for the generatePoemFromPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePoemFromPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  textType: z
    .enum([
      'poem',
      'shayari',
      'ghazal',
      'story',
      'haiku',
      'acrostic',
      'limerick',
      'free verse',
      'sonnet',
      'elegy',
      'villanelle',
      'ode',
      'ballad',
      'epic',
      'blank verse',
      'sestina',
      'lyric poetry',
      'cinquain',
      'occasional poetry',
      'couplet',
      'pastoral',
      'blackout poetry',
      'ekphrastic',
      'pantoum',
      'prose poetry',
      'dramatic poetry',
      'epitaph',
    ])
    .default('poem'),
});
export type GeneratePoemFromPhotoInput = z.infer<typeof GeneratePoemFromPhotoInputSchema>;

const GeneratePoemFromPhotoOutputSchema = z.object({
  poem: z.string().describe('A unique poem generated based on the photo.'),
});
export type GeneratePoemFromPhotoOutput = z.infer<typeof GeneratePoemFromPhotoOutputSchema>;

export async function generatePoemFromPhoto(
  input: GeneratePoemFromPhotoInput
): Promise<GeneratePoemFromPhotoOutput> {
  const result = await generatePoemFromPhotoFlow(input);
  return {
    poem: `${result.poem}\n\n~Satyam mishra`,
  };
}

const generatePoemPrompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  input: {schema: GeneratePoemFromPhotoInputSchema},
  output: {schema: GeneratePoemFromPhotoOutputSchema},
  prompt: `You are a skilled and empathetic writer. Your task is to write a completely new and unique creative piece in the style of a {{{textType}}} that captures the essence, emotion, and mood of the following image. Do not repeat previous responses.

  Write as a real human would, with genuine feeling. Your writing should be evocative and heartfelt. Ensure your response is formatted with appropriate line breaks to appear as a real piece of art.

  Image: {{media url=photoDataUri}}

  Your output should be only the {{{textType}}}.`,
});

const generatePoemFromPhotoFlow = ai.defineFlow(
  {
    name: 'generatePoemFromPhotoFlow',
    inputSchema: GeneratePoemFromPhotoInputSchema,
    outputSchema: GeneratePoemFromPhotoOutputSchema,
  },
  async input => {
    const {output} = await generatePoemPrompt(input);
    return output!;
  }
);
