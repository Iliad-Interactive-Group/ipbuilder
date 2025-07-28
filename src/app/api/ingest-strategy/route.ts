
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { summarizeText } from '@/ai/flows/summarize-text-flow';

// Define the expected schema for the incoming request body
const IngestStrategySchema = z.object({
  strategyText: z.string().min(1, { message: "strategyText cannot be empty." }),
});

/**
 * API endpoint to receive marketing strategy text, process it, 
 * and return a structured marketing brief.
 * @param request - The incoming POST request.
 * @returns A NextResponse object with the marketing brief or an error.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body against the schema
    const validation = IngestStrategySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { strategyText } = validation.data;

    // Call the AI flow to summarize the text and generate the brief
    const marketingBrief = await summarizeText({ text: strategyText });

    // Return a success response with the generated brief
    return NextResponse.json({ success: true, marketingBrief }, { status: 200 });

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Return a more detailed error if AI processing fails
    return NextResponse.json({ success: false, error: "Failed to process strategy text.", details: errorMessage }, { status: 500 });
  }
}
