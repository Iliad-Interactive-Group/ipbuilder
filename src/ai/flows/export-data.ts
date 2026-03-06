
'use server';
/**
 * @fileOverview A flow to export all core data from Firestore into a single XLSX file buffer.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Asset } from '@/lib/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

// The output will be a base64 encoded string of the XLSX file
const ExportOutputSchema = z.string().describe("A base64 encoded string of an XLSX file containing all data.");

export async function exportData(): Promise<string> {
    return await exportDataFlow();
}

export const exportDataFlow = ai.defineFlow(
    {
        name: 'exportDataFlow',
        inputSchema: z.void(),
        outputSchema: ExportOutputSchema,
    },
    async () => {
        console.log("Starting data export flow for XLSX...");
        
        const activeFilter = where('status', '==', 'Active');

        // Note: The original implementation used a single 'assets' collection.
        // The new architecture uses multiple collections. We will export from 'equipment' for now.
        const assetsRef = collection(db, 'equipment');

        const assetsSnapshot = await getDocs(query(assetsRef, activeFilter));

        const allData = assetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Asset[];
        
        // Sanitize data for export, especially array/object fields
        const sanitizedData = allData.map(item => {
            const newItem: {[key: string]: any} = {};
            for (const key in item) {
                const value = (item as any)[key];
                 // Handle ipAddress array by joining into a single string
                if (key === 'ipAddress' && Array.isArray(value)) {
                    newItem[key] = value.join(', ');
                } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
                    newItem[key] = JSON.stringify(value);
                } else {
                    newItem[key] = value;
                }
            }
            return newItem;
        });
        
        console.log(`Exporting ${allData.length} assets to XLSX.`);

        if (sanitizedData.length === 0) {
            console.warn("No active data found to export.");
            return "";
        }
        
        const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");

        // Write to a buffer and convert to base64
        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
        
        return buffer.toString('base64');
    }
);
