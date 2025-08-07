
import { NextRequest, NextResponse } from 'next/server';
import { createMarketingBriefBlueprint } from '@/ai/flows/create-marketing-brief-blueprint-flow';
import type { MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handles preflight CORS requests.
 */
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders
    });
}

/**
 * API endpoint to receive marketing strategy text from various sources, 
 * process it, and then redirect the user to the main page with the 
 * marketing brief data encoded in the URL.
 * 
 * This endpoint can handle both 'application/json' and 
 * 'application/x-www-form-urlencoded' content types.
 * @param request - The incoming POST request.
 * @returns A NextResponse object that redirects the user.
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  try {
    let strategyText: string | null = null;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
        const body = await request.json();
        strategyText = body.strategyText;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        strategyText = formData.get('strategyText') as string | null;
    }

    if (!strategyText || typeof strategyText !== 'string' || strategyText.trim() === '') {
        const errorUrl = new URL('/', origin);
        errorUrl.searchParams.set('error', 'Invalid input. Strategy text cannot be empty.');
        return NextResponse.redirect(errorUrl.toString());
    }

    const marketingBrief: MarketingBriefBlueprint = await createMarketingBriefBlueprint({ rawText: strategyText });

    if (!marketingBrief) {
        throw new Error("The AI failed to generate a marketing brief blueprint.");
    }
    
    const briefString = JSON.stringify(marketingBrief);
    const encodedBrief = Buffer.from(briefString).toString('base64');

    const successUrl = new URL('/', origin);
    successUrl.searchParams.set('brief', encodedBrief);
    
    // Use NextResponse.redirect for external-style redirects, even within the app
    return NextResponse.redirect(successUrl.toString(), { headers: corsHeaders });

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred while processing the strategy.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('error', errorMessage);
    return NextResponse.redirect(errorUrl.toString(), { headers: corsHeaders });
  }
}
