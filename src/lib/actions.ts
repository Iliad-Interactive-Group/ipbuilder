
'use server';

import {
  createDocument,
  updateDocument,
  archiveDocument,
  batchArchiveDocuments,
  addAttachment as serviceAddAttachment,
  deleteAttachment as serviceDeleteAttachment,
} from './firestore-service';
import { CollectionName, AnyEquipment, AnySecret, Site, Market, Company, Station, MaintenanceLog, Attachment, SiteMaintenanceLog } from './types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

// --- Generic Asset Actions ---
export async function addAsset(collectionName: any, data: any) {
  return await createDocument(collectionName, data);
}

export async function updateAsset(collectionName: any, docId: string, data: any) {
  return await updateDocument(collectionName, docId, data);
}

// --- Specific Actions for UI Components ---

// Company Actions
export async function addCompany(data: Omit<Company, 'id' | 'status'>) {
    return await createDocument('companies', data);
}
export async function archiveCompany(id: string) {
    return await archiveDocument('companies', id);
}

// Market Actions
export async function addMarket(data: Omit<Market, 'id' | 'status'>) {
    return await createDocument('markets', data);
}
export async function archiveMarket(id: string) {
    return await archiveDocument('markets', id);
}

// Site Actions
export async function addSite(data: Omit<Site, 'id' | 'status'>) {
    return await createDocument('sites', data);
}
export async function archiveSite(id: string) {
    return await archiveDocument('sites', id);
}

// Station Actions
export async function addStation(data: Omit<Station, 'id' | 'status' | 'marketId' | 'companyId'>, allSites: Site[]) {
    const site = allSites.find(s => s.id === data.siteId);
    if (!site) {
        return { success: false, error: 'Selected site not found.' };
    }
    
    const stationData = {
        ...data,
        marketId: site.marketId,
        companyId: site.companyId,
    };
    return await createDocument('stations', stationData);
}
export async function archiveStation(id: string) {
    return await archiveDocument('stations', id);
}

// Equipment Actions
export async function addEquipment(data: Omit<AnyEquipment, 'id'>) {
    return await createDocument('equipment', data);
}
export async function updateEquipment(id: string, data: Partial<AnyEquipment>) {
    return await updateDocument('equipment', id, data);
}
export async function archiveEquipment(id: string) {
    return await archiveDocument('equipment', id);
}
export async function batchArchiveEquipment(ids: string[]) {
    return await batchArchiveDocuments('equipment', ids);
}


// Secret Actions
export async function addSecret(data: Omit<AnySecret, 'id'>) {
    return await createDocument('secrets', data);
}
export async function archiveSecret(id: string) {
    return await archiveDocument('secrets', id);
}
export async function batchArchiveSecrets(ids: string[]) {
    return await batchArchiveDocuments('secrets', ids);
}


// Batch Actions for Equipment
export async function batchUpdateEquipment(updates: { id: string; data: Partial<AnyEquipment>; special?: 'arrayUnion' }[]) {
  const { writeBatch, doc, arrayUnion } = await import('firebase/firestore');
  const { db } = await import('./firebase');
  
  const batch = writeBatch(db);
  updates.forEach(({ id, data, special }) => {
    const docRef = doc(db, 'equipment', id);
    if (special === 'arrayUnion' && 'stationIds' in data) {
      batch.update(docRef, { stationIds: arrayUnion(data.stationIds) });
    } else {
      batch.update(docRef, data);
    }
  });

  try {
    await batch.commit();
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Error batch updating equipment:', error);
    return { success: false, error: (error as Error).message };
  }
}

// Maintenance Log Actions
export async function addMaintenanceLog(equipmentId: string, log: Omit<MaintenanceLog, 'id'>) {
    const { arrayUnion } = await import('firebase/firestore');
    const newLog = { ...log, id: uuidv4() };
    return await updateDocument('equipment', equipmentId, {
        maintenanceHistory: arrayUnion(newLog) as any
    });
}

export async function addSiteMaintenanceLog(siteId: string, log: Omit<SiteMaintenanceLog, 'id'>) {
    const { arrayUnion } = await import('firebase/firestore');
    const newLog = { ...log, id: uuidv4() };
    return await updateDocument('sites', siteId, {
        maintenanceHistory: arrayUnion(newLog) as any
    });
}

// Attachment Actions
export async function addAttachment(equipmentId: string, fileDataUrl: string, attachmentMeta: Omit<Attachment, 'id' | 'url'>) {
  return await serviceAddAttachment(equipmentId, fileDataUrl, attachmentMeta);
}

export async function deleteAttachment(equipmentId: string, attachment: Attachment) {
  return await serviceDeleteAttachment(equipmentId, attachment);
}
