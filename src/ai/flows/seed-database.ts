
'use server';
/**
 * @fileOverview A flow to seed the database with the initial company, market, and site structure.
 * This is intended to be run once to set up the foundational data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function seedDatabase(): Promise<string> {
    return await seedDatabaseFlow();
}

export const seedDatabaseFlow = ai.defineFlow(
    {
        name: 'seedDatabaseFlow',
        inputSchema: z.void(),
        outputSchema: z.string(),
    },
    async () => {
        console.log("Starting database seeding process...");
        const batch = writeBatch(db);

        // 1. Define the Company
        const company = {
            id: 'comp-img',
            name: 'Iliad Media Group',
            type: 'COMPANY',
            status: 'Active',
        };
        const companyRef = doc(db, 'companies', company.id);
        batch.set(companyRef, company);
        console.log(`Prepared company: ${company.name}`);

        // 2. Define Markets
        const markets = [
            { id: 'mark-magic-valley', name: 'Magic Valley', companyId: company.id },
            { id: 'mark-treasure-valley', name: 'Treasure Valley', companyId: company.id },
        ];

        const sitesByMarket: Record<string, { name: string; shortName: string }[]> = {
            'mark-magic-valley': [
                { name: 'Jerome Butte', shortName: 'JERB' },
                { name: 'Picabo', shortName: 'PIC' },
                { name: 'Twin Falls Studio', shortName: 'TWN' },
            ],
            'mark-treasure-valley': [
                { name: 'Nampa Studio', shortName: 'NMP' },
                { name: 'Deer Point', shortName: 'DP' },
                { name: 'Middleton', shortName: 'MID' },
                { name: 'Clay Peak', shortName: 'CLAY' },
                { name: 'Bennett Mountain', shortName: 'BEN' },
            ]
        };

        for (const market of markets) {
            const marketRef = doc(db, 'markets', market.id);
            batch.set(marketRef, { ...market, type: 'MARKET', status: 'Active' });
            console.log(`Prepared market: ${market.name}`);

            const sites = sitesByMarket[market.id];
            if (sites) {
                for (const site of sites) {
                    const siteId = `site-${site.shortName.toLowerCase()}`;
                    const siteRef = doc(db, 'sites', siteId);
                    batch.set(siteRef, {
                        id: siteId,
                        name: site.name,
                        shortName: site.shortName,
                        marketId: market.id, // Use market ID for relation
                        companyId: company.id, // Use company ID for relation
                        type: 'SITE',
                        status: 'Active',
                        networks: [],
                        maintenanceHistory: [],
                    });
                    console.log(`Prepared site: ${site.name} in market ${market.name}`);
                }
            }
        }

        try {
            await batch.commit();
            const successMessage = "Database seeding successful. Created 1 company, 2 markets, and 8 sites.";
            console.log(successMessage);
            return successMessage;
        } catch (error) {
            console.error("Error committing batch for seeding:", error);
            throw new Error("Failed to seed database.");
        }
    }
);
