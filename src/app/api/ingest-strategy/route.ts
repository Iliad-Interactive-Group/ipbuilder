
import { NextRequest, NextResponse } from 'next/server';
import type { MarketingBriefBlueprint } from '@/ai/schemas/marketing-brief-schemas';

/**
 * Gets the allowed CORS origins from environment variables.
 * In production, requires explicit configuration. In development, defaults to wildcard.
 * 
 * @returns Comma-separated string of allowed origins or '*' for wildcard
 */
const getAllowedOrigins = (): string => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (allowedOrigins && allowedOrigins.trim().length > 0) {
        return allowedOrigins;
    }
    // Default to wildcard only in development/local
    return process.env.NODE_ENV === 'production' ? '' : '*';
};

/**
 * Generates appropriate CORS headers based on request origin and configuration.
 * 
 * @param origin - The origin header from the incoming request
 * @returns Object containing CORS headers
 */
const getCorsHeaders = (origin: string | null): Record<string, string> => {
    const allowedOrigins = getAllowedOrigins();
    
    // If specific origins are configured, validate the request origin
    if (allowedOrigins !== '*' && allowedOrigins.length > 0) {
        const allowedOriginsList = allowedOrigins.split(',').map(o => o.trim());
        if (origin && allowedOriginsList.includes(origin)) {
            return {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            };
        }
        // If origin is not in allowed list, don't set CORS headers
        return {
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };
    }
    
    // Wildcard CORS (only for development)
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
};

/**
 * Handles preflight CORS requests.
 */
export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    return new NextResponse(null, {
        status: 204,
        headers: getCorsHeaders(origin)
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

        // Validate that required fields are present and are strings
        if (!companyName || typeof companyName !== 'string' || companyName.trim().length === 0) {
            throw new Error("Invalid or missing companyName field.");
        }
        if (!productDescription || typeof productDescription !== 'string' || productDescription.trim().length === 0) {
            throw new Error("Invalid or missing productServiceDescription field.");
        }
        if (!keywords || typeof keywords !== 'string' || keywords.trim().length === 0) {
            throw new Error("Invalid or missing keywords field.");
        }

        // Sanitize and validate inputs (basic length checks)
        // Max length of 10,000 characters to prevent excessively large payloads
        // while still supporting comprehensive product descriptions and keywords
        const MAX_INPUT_FIELD_LENGTH = 10000;
        if (companyName.length > MAX_INPUT_FIELD_LENGTH) {
            throw new Error("companyName exceeds maximum allowed length.");
        }
        if (productDescription.length > MAX_INPUT_FIELD_LENGTH) {
            throw new Error("productServiceDescription exceeds maximum allowed length.");
        }
        if (keywords.length > MAX_INPUT_FIELD_LENGTH) {
            throw new Error("keywords exceeds maximum allowed length.");
        }

        // Construct the brief from the validated form data
        marketingBrief = {
            companyName: companyName.trim(),
            productDescription: productDescription.trim(),
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k.length > 0),
        };
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
    
    const requestOrigin = request.headers.get('origin');
    return NextResponse.redirect(successUrl.toString(), { headers: getCorsHeaders(requestOrigin) });

  } catch (error) {
    console.error("Error in /api/ingest-strategy:", error);
    let errorMessage = "An unexpected error occurred while processing the strategy.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }

    const errorUrl = new URL('/', origin);
    errorUrl.searchParams.set('error', errorMessage);
    const requestOrigin = request.headers.get('origin');
    return NextResponse.redirect(errorUrl.toString(), { headers: getCorsHeaders(requestOrigin) });
  }
}
