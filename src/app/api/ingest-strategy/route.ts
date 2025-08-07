
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createMarketingBriefBlueprint } from '@/ai/flows/create-marketing-brief-blueprint-flow';

const IngestStrategySchema = z.object({
  strategyText: z.string().min(1, { message: "strategyText cannot be empty." }),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * API endpoint to receive marketing strategy text, process it using the blueprint flow,
 * and return the marketing brief data as JSON. Now includes CORS headers.
 * @param request - The incoming POST or OPTIONS request.
 * @returns A NextResponse object with the brief data or an error.
 */
export async function OPTIONS(request: Request) {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders
    });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = IngestStrategySchema.safeParse(body);

    if (!validation.success) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid input. 'strategyText' cannot be empty." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { strategyText } = validation.data;

    const marketingBrief = await createMarketingBriefBlueprint({ rawText: strategyText });

    if (!marketingBrief) {
      throw new Error("The AI failed to generate a marketing brief blueprint.");
    }
    
    // Instead of redirecting, we now return the JSON data directly.
    return new NextResponse(JSON.stringify(marketingBrief), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred while processing the strategy.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    
    return new NextResponse(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: corsHeaders }
    );
  }
}
