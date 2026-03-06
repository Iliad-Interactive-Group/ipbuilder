
'use server';
/**
 * @fileOverview A flow to import data from a CSV or XLSX file, using an AI model to parse
 * equipment records if needed. The parsed data is then written to the 'equipment' collection in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AnyEquipment } from '@/lib/types';
import * as XLSX from 'xlsx';

const ImportInputSchema = z.object({
    fileData: z.string().describe("A base64 encoded string of the file to import."),
    fileName: z.string().describe("The name of the file, including extension."),
    siteId: z.string().optional().describe("The ID of the site to associate the data with."),
    marketId: z.string().optional().describe("The ID of the market to associate the data with."),
});

const EquipmentRecordSchema = z.object({
    name: z.string().describe("The descriptive name of the equipment."),
    ipAddress: z.string().optional().describe("The IP address of the equipment."),
    equipmentType: z.string().optional().describe("The designated type or category of the equipment (e.g., Computer, Camera, STL)."),
    username: z.string().optional(),
    passwords: z.string().optional(),
});

const ParsedOutputSchema = z.object({
    equipment: z.array(EquipmentRecordSchema).describe("An array of parsed equipment records from the CSV data."),
});

const ImportOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    counts: z.object({
        equipment: z.number(),
    }),
});

export async function importData(input: z.infer<typeof ImportInputSchema>): Promise<z.infer<typeof ImportOutputSchema>> {
    return await importDataFlow(input);
}

const parsingPrompt = ai.definePrompt({
    name: 'csvParsingPrompt',
    input: { schema: z.object({ csvData: z.string() }) },
    output: { schema: ParsedOutputSchema },
    prompt: `You are an expert data parsing agent. Your task is to analyze the provided raw CSV data and transform it into a structured JSON object for equipment. The CSV contains a list of equipment with columns like 'DEVICE', 'Name', 'IP', and 'Type'.

- You must skip any row where the primary name column ('DEVICE' or 'Name') is empty or contains only whitespace.
- For each valid equipment row, create a JSON object for the 'equipment' array. Map the primary name column to 'name', 'IP' to 'ipAddress', and 'Type' to 'equipmentType'.

Here is the CSV data to parse:
---
{{{csvData}}}
---

Provide only the final JSON output.
`,
});

export const importDataFlow = ai.defineFlow(
    {
        name: 'importDataFlow',
        inputSchema: ImportInputSchema,
        outputSchema: ImportOutputSchema,
    },
    async ({ fileData, fileName, siteId, marketId }) => {
        console.log(`Starting data import from file: ${fileName}. Site Context: ${siteId || 'Company-wide'}`);
        
        let equipmentRecords: Partial<AnyEquipment>[] = [];

        if (fileName.endsWith('.xlsx')) {
            console.log("Parsing XLSX file.");
            const buffer = Buffer.from(fileData, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            equipmentRecords = XLSX.utils.sheet_to_json(worksheet);
            console.log(`Parsed ${equipmentRecords.length} records from XLSX.`);
        } else {
            console.log("Parsing text/csv file with AI.");
            const csvData = Buffer.from(fileData, 'base64').toString('utf8');
            const { output } = await parsingPrompt({ csvData });
            if (output?.equipment) {
                equipmentRecords = output.equipment as unknown as Partial<AnyEquipment>[];
            }
             console.log(`AI parsed ${equipmentRecords.length} equipment records from CSV/TXT.`);
        }

        if (!equipmentRecords || equipmentRecords.length === 0) {
            console.warn("No equipment records found to import.");
            return {
                success: false,
                message: "Import failed: No valid equipment records could be parsed from the provided file.",
                counts: { equipment: 0 },
            };
        }

        const counts = { equipment: 0 };
        const batch = writeBatch(db);
        const companyId = "comp-img"; // Hardcoded company ID from seeding script

        for (const record of equipmentRecords) {
            if (!record.name) continue;

            // Prioritize siteId from the record itself, then from the UI context
            const finalSiteId = record.siteId || siteId;
            const finalMarketId = record.marketId || marketId;

            const equipmentId = record.id || `equip-${(record.ipAddress?.[0] || record.name).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Math.random().toString(36).substring(2,7)}`;
            
            const newEquipment: Partial<AnyEquipment> = {
                ...record,
                id: equipmentId,
                name: record.name,
                description: record.description || record.name,
                ipAddress: typeof (record.ipAddress as unknown) === 'string' ? (record.ipAddress as unknown as string).split(',').map((ip: string) => ip.trim()).filter(Boolean) : Array.isArray(record.ipAddress) ? record.ipAddress : [],
                equipmentType: record.equipmentType || record.category || 'Other',
                category: record.category || record.equipmentType || 'Other',
                type: 'EQUIPMENT',
                status: 'Active',
                companyId: companyId,
                marketId: finalSiteId ? finalMarketId : undefined,
                siteId: finalSiteId || undefined,
            };

            const equipRef = doc(db, 'equipment', equipmentId);
            batch.set(equipRef, newEquipment, { merge: true });
            counts.equipment++;
        }

        await batch.commit();
        console.log(`Committed ${counts.equipment} equipment records.`);

        const message = `Import complete. Processed and saved ${counts.equipment} equipment records.`;
        console.log(message);

        return {
            success: true,
            message,
            counts,
        };
    }
);
