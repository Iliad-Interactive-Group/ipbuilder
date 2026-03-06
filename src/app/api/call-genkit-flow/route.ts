
// src/app/api/call-genkit-flow/route.ts
import { NextResponse } from 'next/server';
import { exportDataFlow } from '@/ai/flows/export-data';
import { importDataFlow } from '@/ai/flows/import-data';
import { seedDatabaseFlow } from '@/ai/flows/seed-database';
import { aiPoweredSuggestions } from '@/ai/flows/ai-powered-suggestions';
import { generateEquipmentReport } from '@/ai/flows/generate-equipment-report';
import { importSiteData } from '@/ai/flows/import-site-data';
import { importCredentials } from '@/ai/flows/import-credentials';

type FlowFn = (input: unknown) => Promise<unknown>;

const flowRegistry: Record<string, FlowFn> = {
  exportDataFlow: exportDataFlow as FlowFn,
  importDataFlow: importDataFlow as FlowFn,
  seedDatabaseFlow: seedDatabaseFlow as FlowFn,
  aiPoweredSuggestionsFlow: aiPoweredSuggestions as FlowFn,
  generateEquipmentReportFlow: generateEquipmentReport as FlowFn,
  importSiteDataFlow: importSiteData as FlowFn,
  importCredentialsFlow: importCredentials as FlowFn,
};

export async function POST(req: Request) {
  try {
    const { flowId, input } = await req.json();

    if (!flowId) {
      return NextResponse.json({ error: 'flowId is required' }, { status: 400 });
    }

    const flowFn = flowRegistry[flowId];
    if (!flowFn) {
      return NextResponse.json({ error: `Flow '${flowId}' not found` }, { status: 404 });
    }

    const result = await flowFn(input);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
