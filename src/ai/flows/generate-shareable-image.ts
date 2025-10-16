'use server';
/**
 * @fileOverview Generates a shareable image from a poem and a template.
 *
 * - generateShareableImage - A function that handles the image generation.
 * - GenerateShareableImageInput - The input type for the function.
 * - GenerateShareableImageOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShareableImageInputSchema = z.object({
  poem: z.string().describe('The text (poem, shayari, ghazal) to put on the image.'),
  templateImageUri: z.string().describe('The template image data URI.'),
  username: z.string().describe('The username to display at the top.'),
  creator: z.string().describe('The creator text to display at the bottom.'),
});
export type GenerateShareableImageInput = z.infer<typeof GenerateShareableImageInputSchema>;

const GenerateShareableImageOutputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "The generated photo as a data URI. Format: 'data:image/png;base64,<encoded_data>'."
    ),
});
export type GenerateShareableImageOutput = z.infer<typeof GenerateShareableImageOutputSchema>;

export async function generateShareableImage(
  input: GenerateShareableImageInput
): Promise<GenerateShareableImageOutput> {
  return generateShareableImageFlow(input);
}

const generateShareableImageFlow = ai.defineFlow(
  {
    name: 'generateShareableImageFlow',
    inputSchema: GenerateShareableImageInputSchema,
    outputSchema: GenerateShareableImageOutputSchema,
  },
  async ({poem, templateImageUri, username, creator}) => {
    const {output} = await ai.generate({
      model: 'googleai/gemini-pro-vision',
      prompt: [
        {media: {url: templateImageUri}},
        {
          text: `
          Please edit the provided template image. Do not change the existing design, border, or background.
          Follow these instructions precisely:
          1.  At the very top of the image, positioned above the decorative border, add the username: "${username}". Use a font size that is noticeably larger than the poem text. The color of this text must exactly match the color of the border.
          2.  Inside the bordered area, perfectly centered, place the following poem. You must adjust the font size so all the text fits neatly without overlapping the borders.

              Poem:
              ${poem}

          3.  At the very bottom of the image, positioned below the decorative border, add the creator text: "${creator}". The color of this text must also exactly match the color of the border.
          
          Return only the modified image.
        `,
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const imageUrl = output?.message.content[0]?.media?.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return a data URI.');
    }

    return {photoDataUri: imageUrl};
  }
);
