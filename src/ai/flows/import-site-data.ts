
'use server';
/**
 * @fileOverview A flow to import site-specific data from a CSV string, focusing on
 * parsing network information and updating the corresponding site document in Firestore.
 */

import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Papa from 'papaparse';

const ImportSiteDataInputSchema = z.object({
    csvData: z.string().describe("A base64 encoded string containing the CSV data to be parsed for site network information."),
    siteId: z.string().describe("The ID of the site document to update with the parsed network info."),
});

const ImportSiteDataOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

export async function importSiteData(input: z.infer<typeof ImportSiteDataInputSchema>): Promise<z.infer<typeof ImportSiteDataOutputSchema>> {
    const { csvData, siteId } = input;
    console.log(`Starting site data import for site: ${siteId}`);
    
    const fileContent = Buffer.from(csvData, 'base64').toString('utf8');

    let parsedData;
    try {
        parsedData = Papa.parse(fileContent, {
            skipEmptyLines: true,
        });
    } catch (e) {
        return {
            success: false,
            message: "Failed to parse file. Ensure it's a valid CSV or text file."
        }
    }

    const rows = parsedData.data as string[][];
    const networkInfo: { external_ip?: string, gateway?: string, subnet?: string, network_name?: string } = { network_name: 'Primary' };
    
    for (const row of rows) {
        const key = row[0]?.toUpperCase().trim();
        const value = row[1]?.trim();

        if (key && value) {
            if (key.includes('EXTERNAL IP')) {
                networkInfo.external_ip = value;
            } else if (key.includes('EXTERNAL G/W')) {
                networkInfo.gateway = value;
            } else if (key.includes('SUBNET')) {
                networkInfo.subnet = value;
            }
        }
    }
    
    if (!networkInfo.external_ip && !networkInfo.gateway) {
        return {
            success: false,
            message: "Import failed: Could not find 'EXTERNAL IP' or 'EXTERNAL G/W' in the provided data.",
        };
    }
    
    try {
        const siteRef = doc(db, 'sites', siteId);
        await updateDoc(siteRef, {
            networks: [networkInfo]
        });
        const message = `Import complete. Updated site ${siteId} with network configuration.`;
        console.log(message);
        return {
            success: true,
            message,
        };
    } catch (e) {
        console.error(`Failed to update network info for site ${siteId}:`, e);
        return {
            success: false,
            message: `Failed to write network data to site document: ${(e as Error).message}`,
        };
    }
}
