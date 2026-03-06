
'use server';
/**
 * @fileOverview An AI-powered flow to import credentials from a CSV file,
 * such as an export from Google Password Manager.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { writeBatch, collection, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { WebsitePassword } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import Papa from 'papaparse';

const ImportCredentialsInputSchema = z.object({
  fileData: z.string().describe("A string containing the full CSV data to be parsed."),
  fileName: z.string().describe("The name of the file being imported."),
});

const ImportOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  counts: z.object({
    credentials: z.number(),
  }),
});

// Helper to find the correct header index
const findHeaderIndex = (headers: string[], possibleNames: string[]) => {
    for (const name of possibleNames) {
        const index = headers.findIndex(h => h.toLowerCase().includes(name));
        if (index !== -1) return index;
    }
    return -1;
};


export async function importCredentials(input: z.infer<typeof ImportCredentialsInputSchema>): Promise<z.infer<typeof ImportOutputSchema>> {
    console.log(`Starting credential import from file: ${input.fileName}`);
    
    let parsedData;
    try {
        parsedData = Papa.parse(input.fileData, {
            header: true,
            skipEmptyLines: true,
        });

        if (parsedData.errors.length) {
            console.warn("Parsing errors occurred:", parsedData.errors);
        }

    } catch (e) {
         return {
            success: false,
            message: "Failed to parse the file. Please ensure it's a valid CSV or text file.",
            counts: { credentials: 0 },
        };
    }
    
    const records = parsedData.data as any[];
    const headers = (parsedData.meta.fields || []).map(f => f.toLowerCase());
    
    const nameIndex = findHeaderIndex(headers, ['name', 'title']);
    const urlIndex = findHeaderIndex(headers, ['url', 'website']);
    const usernameIndex = findHeaderIndex(headers, ['username']);
    const passwordIndex = findHeaderIndex(headers, ['password']);
    const notesIndex = findHeaderIndex(headers, ['note']);

    if (nameIndex === -1 || urlIndex === -1 || usernameIndex === -1) {
        return {
            success: false,
            message: `Import failed: Could not find required columns. Must include at least 'name', 'url', and 'username'. Found: ${headers.join(', ')}`,
            counts: { credentials: 0 },
        };
    }
    
    const counts = { credentials: 0 };
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const record of records) {
        const name = record[headers[nameIndex]];
        const url = record[headers[urlIndex]];
        const username = record[headers[usernameIndex]];

        if (!name || !url || !username) continue;

        const secretId = `sec-${uuidv4()}`;
        const newSecret: Omit<WebsitePassword, 'tags'> & { tags: string[] } = {
            id: secretId,
            type: 'websitePassword',
            name: name,
            url: url,
            username: username,
            password: passwordIndex !== -1 ? record[headers[passwordIndex]] : '',
            notes: notesIndex !== -1 ? record[headers[notesIndex]] : '',
            description: `Imported from file: ${input.fileName}`,
            tags: ['imported'],
            organizationId: 'org_alpha', // Placeholder
            createdAt: now,
            updatedAt: now,
            createdBy: 'system-import',
            updatedBy: 'system-import',
        };

        const secretRef = doc(db, 'secrets', secretId);
        batch.set(secretRef, newSecret, { merge: true });
        counts.credentials++;
    }

    if (counts.credentials === 0) {
        return {
            success: false,
            message: "No valid credential rows found to import.",
            counts: { credentials: 0 },
        };
    }

    await batch.commit();
    console.log(`Committed ${counts.credentials} secret records.`);

    const message = `Import complete. Processed and saved ${counts.credentials} credentials.`;

    return {
        success: true,
        message,
        counts,
    };
}
