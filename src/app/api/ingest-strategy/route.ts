
import { NextRequest, NextResponse } from 'next/server';
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
 * API endpoint to receive structured or unstructured marketing data, 
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
    let marketingBrief: MarketingBriefBlueprint;
    const contentType = request.headers.get('content-type') || '';

    // Check if the incoming request is from the external GrowthOS form
    // which sends structured data.
    if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const companyName = formData.get('companyName') as string | null;
        const productDescription = formData.get('productServiceDescription') as string | null;
        const keywords = formData.get('keywords') as string | null;

        if (companyName && productDescription && keywords) {
            // Directly construct the brief from the form data, bypassing the AI parsing step.
            marketingBrief = {
                companyName: companyName,
                productDescription: productDescription,
                keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
            };
        } else {
             // If the expected fields aren't there, throw an error.
             throw new Error("Incomplete form data. Required fields are missing.");
        }
    } else {
         // Fallback for any other type of request, which should not happen in the current flow.
         // This can be adapted if other input methods are added later.
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    if (!marketingBrief) {
        throw new Error("Failed to create a marketing brief from the provided input.");
    }
    
    const briefString = JSON.stringify(marketingBrief);
    const encodedBrief = Buffer.from(briefString).toString('base64');

    const successUrl = new URL('/', origin);
    successUrl.searchParams.set('brief', encodedBrief);
    
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
