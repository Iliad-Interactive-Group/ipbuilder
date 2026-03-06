
'use server';

import { doc, getDoc, setDoc, WriteBatch } from 'firebase/firestore';
import { db } from './firebase';
import { v4 as uuidv4 } from 'uuid';
import { CollectionName, ChangeEvent } from './types';
import { getAuth } from 'firebase/auth';
import { auth } from './firebase';

/**
 * Logs a change event to the 'changelog' collection.
 * Can be included in an existing Firestore batch write.
 */
export async function logChange(
  collection: CollectionName,
  docId: string,
  action: ChangeEvent['action'],
  summary: string,
  batch?: WriteBatch
) {
  try {
    const user = auth.currentUser;

    const change: ChangeEvent = {
      id: `change-${uuidv4()}`,
      timestamp: new Date().toISOString(),
      userId: user?.uid || 'system',
      userName: user?.displayName || 'System',
      action,
      collection,
      docId,
      summary,
    };
    
    // Attempt to get a more descriptive name for the document
    if(action !== 'create') {
        const docSnap = await getDoc(doc(db, collection, docId));
        if(docSnap.exists()){
            change.docName = docSnap.data().name || docId;
        }
    } else {
        // For create, the summary should contain the name
        // This avoids a race condition where the doc isn't available yet
    }

    const changelogRef = doc(db, 'changelog', change.id);

    if (batch) {
      batch.set(changelogRef, change);
    } else {
      await setDoc(changelogRef, change);
    }

  } catch (error) {
    console.error(`[changelog-service] Failed to log change for ${collection}/${docId}:`, error);
    // We don't re-throw the error, as logging should not block the primary operation.
  }
}

    