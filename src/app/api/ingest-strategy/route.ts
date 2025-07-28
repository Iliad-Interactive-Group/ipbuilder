
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the expected schema for the incoming request body
const IngestStrategySchema = z.object({
  strategyText: z.string().min(1, { message: "strategyText cannot be empty." }),
});

/**
 * API endpoint to receive marketing strategy text from an external application.
 * @param request - The incoming POST request.
 * @returns A NextResponse object.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate the request body against the schema
    const validation = IngestStrategySchema.safeParse(body);

    if (!validation.success) {
      // If validation fails, return a 400 Bad Request response with the errors
      return NextResponse.json({ success: false, errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    // The strategyText is valid and can be used.
    const { strategyText } = validation.data;

    // For now, we will just log the received text and return a success message.
    // In a future step, this could be stored or used to pre-populate the main application form.
    console.log("Received strategy text:", strategyText.substring(0, 100) + "..."); // Log a snippet

    // Return a success response
    return NextResponse.json({ success: true, message: "Strategy text received successfully." }, { status: 200 });

  } catch (error) {
    // Handle potential JSON parsing errors or other unexpected errors
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ success: false, error: "Invalid request body.", details: errorMessage }, { status: 500 });
  }
}
