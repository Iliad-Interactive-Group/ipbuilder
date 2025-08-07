
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
  try {
    const body = await request.json();

    const validation = IngestStrategySchema.safeParse(body);

    if (!validation.success) {
      const errorQuery = new URLSearchParams({ error: "Invalid input. 'strategyText' cannot be empty." }).toString();
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = errorQuery;
      return NextResponse.redirect(url);
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
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = briefQuery;
    
    return NextResponse.redirect(url);

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred while processing the strategy.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    const errorQuery = new URLSearchParams({ error: errorMessage }).toString();
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = errorQuery;
    return NextResponse.redirect(url);
  }
}
