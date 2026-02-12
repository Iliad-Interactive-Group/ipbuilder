import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Cloud Run and monitoring services.
 * Returns 200 OK if the application is running properly.
 */
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ipbuilder'
    },
    { status: 200 }
  );
}
