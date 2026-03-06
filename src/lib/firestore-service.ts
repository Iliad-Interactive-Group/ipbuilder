
'use server';

import { revalidatePath } from 'next/cache';
import { collection, doc, writeBatch, setDoc, getDoc, updateDoc, arrayUnion, deleteDoc, arrayRemove } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { Attachment, CollectionName } from './types';
import { logChange } from './changelog-service';

/**
 * Creates a new document in the specified collection with a generated ID and timestamps.
 */
export async function createDocument<T extends object>(collectionName: CollectionName, data: T) {
  try {
    let id: string;
    if (collectionName === 'secrets') {
      id = `sec-${uuidv4()}`;
    } else if (['companies', 'markets', 'sites', 'stations'].includes(collectionName)) {
        const typePrefix = collectionName.substring(0, 4);
        const namePart = (data as any).name?.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toLowerCase() || uuidv4().substring(0, 8);
        id = `${typePrefix}-${namePart}-${uuidv4().substring(0, 4)}`;
    }
    else {
      const assetType = (data as any).type?.substring(0, 5).toLowerCase() || 'asset';
      id = `${assetType.replace(/[^a-z0-9]/, '')}-${uuidv4()}`;
    }

    const now = new Date().toISOString();
    const payload = { ...data, id, status: 'Active', createdAt: now, updatedAt: now };

    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, payload);
    await logChange(collectionName, id, 'create', `Created new document: ${(payload as any).name || id}`);
    
    revalidatePath('/', 'layout');
    return { success: true, id };
  } catch (error) {
    console.error(`[firestore-service] Error creating document in ${collectionName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Updates an existing document in the specified collection.
 */
export async function updateDocument<T extends object>(collectionName: CollectionName, docId: string, data: Partial<T>) {
  try {
    const docRef = doc(db, collectionName, docId);
    const payload = { ...data, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, payload);
    
    // Create a summary of changes
    const changedFields = Object.keys(data).join(', ');
    await logChange(collectionName, docId, 'update', `Updated fields: ${changedFields}`);

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error(`[firestore-service] Error updating document ${docId} in ${collectionName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Atomically moves a single document to the 'archive' collection.
 */
export async function archiveDocument(collectionName: CollectionName, docId: string) {
  const batch = writeBatch(db);
  const docRef = doc(db, collectionName, docId);
  const archiveRef = doc(db, 'archive', `${collectionName}_${docId}`);

  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Document to archive not found.");
    }
    const docData = docSnap.data();

    batch.set(archiveRef, {
      archivedAt: new Date().toISOString(),
      originalCollection: collectionName,
      originalId: docId,
      data: docData,
    });
    batch.delete(docRef);
    
    await logChange(collectionName, docId, 'archive', `Archived document: ${(docData as any).name || docId}`, batch);

    await batch.commit();
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error) {
    console.error(`[firestore-service] Error archiving document ${docId} from ${collectionName}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Atomically moves multiple documents to the 'archive' collection.
 */
export async function batchArchiveDocuments(collectionName: CollectionName, docIds: string[]) {
    if (docIds.length === 0) return { success: true };

    const batch = writeBatch(db);
    
    try {
        // Note: Firestore batch get is not available in the client SDK, so we read docs one by one.
        for (const docId of docIds) {
            const docRef = doc(db, collectionName, docId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const docData = docSnap.data();
                const archiveRef = doc(db, 'archive', `${collectionName}_${docId}`);
                
                batch.set(archiveRef, {
                    archivedAt: new Date().toISOString(),
                    originalCollection: collectionName,
                    originalId: docId,
                    data: docData,
                });
                batch.delete(docRef);
                await logChange(collectionName, docId, 'archive', `Batch archived document: ${(docData as any).name || docId}`, batch);
            }
        }
        
        await batch.commit();
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error) {
        console.error(`[firestore-service] Error batch archiving from ${collectionName}:`, error);
        return { success: false, error: (error as Error).message };
    }
}


// --- Attachment Specific Actions ---
export async function addAttachment(equipmentId: string, fileDataUrl: string, attachmentMeta: Omit<Attachment, 'id' | 'url'>) {
  const storageRef = ref(storage, `attachments/${equipmentId}/${attachmentMeta.fileName}`);
  
  try {
    const snapshot = await uploadString(storageRef, fileDataUrl, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);

    const newAttachment: Attachment = {
      ...attachmentMeta,
      id: uuidv4(),
      url: downloadURL,
    };

    await updateDoc(doc(db, 'equipment', equipmentId), {
        attachments: arrayUnion(newAttachment)
    });
    
    await logChange('equipment', equipmentId, 'update', `Added attachment: ${newAttachment.fileName}`);

    revalidatePath('/');
    return { success: true };

  } catch (error) {
    console.error("[firestore-service] Error uploading attachment:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteAttachment(equipmentId: string, attachment: Attachment) {
  const storageRef = ref(storage, attachment.url);
  try {
    await deleteObject(storageRef);
    await updateDoc(doc(db, 'equipment', equipmentId), {
        attachments: arrayRemove(attachment)
    });

    await logChange('equipment', equipmentId, 'update', `Deleted attachment: ${attachment.fileName}`);

    revalidatePath('/');
    return { success: true };
  } catch (error) {
     console.error("[firestore-service] Error deleting attachment:", error);
     try {
       await updateDoc(doc(db, 'equipment', equipmentId), {
         attachments: arrayRemove(attachment)
       });
       revalidatePath('/');
       return { success: true, warning: 'File not found in storage, but record removed from database.' };
     } catch (dbError) {
        return { success: false, error: (dbError as Error).message };
     }
  }
}

    