
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMarketingBriefBlueprint } from '@/ai/flows/create-marketing-brief-blueprint-flow';

const IngestStrategySchema = z.object({
  strategyText: z.string().min(1, { message: "strategyText cannot be empty." }),
});

/**
 * API endpoint to receive marketing strategy text, process it using the blueprint flow,
 * and redirect back to the homepage with the marketing brief data in the URL.
 * @param request - The incoming POST request.
 * @returns A NextResponse object that redirects the user.
 */
export async function POST(request: Request) {
  const host = request.headers.get('host');
  const protocol = host?.startsWith('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const body = await request.json();

    const validation = IngestStrategySchema.safeParse(body);

    if (!validation.success) {
      const errorQuery = new URLSearchParams({ error: "Invalid input. 'strategyText' cannot be empty." }).toString();
      const errorUrl = new URL(`/?${errorQuery}`, baseUrl);
      return NextResponse.redirect(errorUrl);
    }

    const { strategyText } = validation.data;

    // Use the new, unified blueprint flow
    const marketingBrief = await createMarketingBriefBlueprint({ rawText: strategyText });

    if (!marketingBrief) {
      throw new Error("The AI failed to generate a marketing brief blueprint.");
    }

    // Encode the brief to be safely passed in a URL
    const briefString = JSON.stringify(marketingBrief);
    const encodedBrief = Buffer.from(briefString).toString('base64');

    const briefQuery = new URLSearchParams({ brief: encodedBrief }).toString();
    const successUrl = new URL(`/?${briefQuery}`, baseUrl);
    
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred while processing the strategy.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    const errorQuery = new URLSearchParams({ error: errorMessage }).toString();
    const errorUrl = new URL(`/?${errorQuery}`, baseUrl);
    return NextResponse.redirect(errorUrl);
  }
}
