# Sample Snapshot API Migration Guide for Cloud Run

## Overview

The `/api/sample-snapshot` endpoint currently writes JSON files to the local filesystem (`sampleoutput/` directory). This is incompatible with Cloud Run's ephemeral filesystem, where any written files are lost when the container restarts or scales down.

## Current Implementation

Located at: `src/app/api/sample-snapshot/route.ts`

**Current behavior:**
- Receives snapshot data via POST request
- Writes JSON files to `sampleoutput/` directory on the local filesystem
- Uses filesystem for persistent storage

**Issue:** Cloud Run containers have an ephemeral filesystem. Any data written to the filesystem is:
- Limited to 32GB
- Lost when the container is stopped or restarted
- Not shared between container instances
- Not suitable for persistent storage

## Migration Options

### Option 1: Google Cloud Storage (Recommended for Production)

Use Google Cloud Storage (GCS) for persistent, scalable file storage.

#### Benefits
- Durable and scalable
- Cost-effective for large files
- Can generate signed URLs for secure access
- Works seamlessly with Cloud Run

#### Implementation Steps

1. **Install the GCS SDK:**
```bash
npm install @google-cloud/storage
```

2. **Create a GCS bucket:**
```bash
# Set your project ID
PROJECT_ID="your-project-id"

# Create bucket
gsutil mb -l us-central1 gs://ipbuilder-snapshots

# Optional: Make public (if needed)
gsutil iam ch allUsers:objectViewer gs://ipbuilder-snapshots
```

3. **Update the API route:**
```typescript
import { NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { format } from 'date-fns';

const storage = new Storage();
const bucketName = process.env.GCS_BUCKET_NAME || 'ipbuilder-snapshots';

function getUniqueFilename(baseName: string, extension: string): string {
  const timestamp = format(new Date(), 'MMdd-HHmm');
  const random = Math.random().toString(36).substring(2, 8);
  return `${baseName}-${timestamp}-${random}${extension}`;
}

function printTree(files: string[]): string {
  // ... existing printTree function
}

export async function POST(request: Request) {
  try {
    console.log('Receiving pre-processed snapshot data...');

    const body = await request.json();
    const { outputName, snapshotData } = body;
    
    if (!outputName || !snapshotData || !snapshotData.files) {
      return NextResponse.json(
        { message: "Invalid request body. Missing 'outputName' or 'snapshotData'." },
        { status: 400 }
      );
    }

    const fileContents = snapshotData.files;
    const filePaths = Object.keys(fileContents);

    if (filePaths.length === 0) {
      return NextResponse.json(
        { message: "Received snapshot data but it contains no files." },
        { status: 400 }
      );
    }

    const fileTree = printTree(filePaths);
    const finalJson = {
      file_tree: fileTree,
      files: fileContents,
    };

    // Upload to GCS
    const filename = getUniqueFilename(outputName, '.json');
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    
    await file.save(JSON.stringify(finalJson, null, 2), {
      contentType: 'application/json',
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    // Generate public URL or signed URL
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;
    
    console.log(`Sample snapshot uploaded successfully to GCS: ${publicUrl}`);

    return NextResponse.json({
      message: 'Sample snapshot created successfully.',
      snapshotUrl: publicUrl,
      snapshotPath: filename,
    });

  } catch (error: any) {
    console.error('Failed to create sample snapshot:', error);
    return NextResponse.json(
      { message: `Failed to create sample snapshot: ${error.message}` },
      { status: 500 }
    );
  }
}
```

4. **Grant Cloud Run service account access to GCS:**
```bash
# Get the Cloud Run service account
SERVICE_ACCOUNT=$(gcloud run services describe ipbuilder --region=us-central1 --format='value(spec.template.spec.serviceAccountName)')

# If empty, it's using the default compute service account
if [ -z "$SERVICE_ACCOUNT" ]; then
  PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
fi

# Grant Storage Object Admin permission
gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:roles/storage.objectAdmin gs://ipbuilder-snapshots
```

5. **Add environment variable to Cloud Run:**
```bash
gcloud run services update ipbuilder \
  --update-env-vars GCS_BUCKET_NAME=ipbuilder-snapshots \
  --region=us-central1
```

Or update in GitHub Actions workflow:
```yaml
--set-env-vars="NODE_ENV=production,GCS_BUCKET_NAME=ipbuilder-snapshots"
```

### Option 2: Firestore (Recommended for Development)

Use Firestore (already integrated with Firebase) to store snapshots as documents.

#### Benefits
- Already integrated with your Firebase setup
- No additional dependencies
- Good for structured data
- Real-time capabilities

#### Implementation Steps

1. **Update the API route:**
```typescript
import { NextResponse } from 'next/server';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '@/firebase/client';
import { format } from 'date-fns';

const db = getFirestore(app);

function printTree(files: string[]): string {
  // ... existing printTree function
}

export async function POST(request: Request) {
  try {
    console.log('Receiving pre-processed snapshot data...');

    const body = await request.json();
    const { outputName, snapshotData } = body;
    
    if (!outputName || !snapshotData || !snapshotData.files) {
      return NextResponse.json(
        { message: "Invalid request body. Missing 'outputName' or 'snapshotData'." },
        { status: 400 }
      );
    }

    const fileContents = snapshotData.files;
    const filePaths = Object.keys(fileContents);

    if (filePaths.length === 0) {
      return NextResponse.json(
        { message: "Received snapshot data but it contains no files." },
        { status: 400 }
      );
    }

    const fileTree = printTree(filePaths);
    const finalJson = {
      file_tree: fileTree,
      files: fileContents,
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'snapshots'), {
      name: outputName,
      data: finalJson,
      createdAt: serverTimestamp(),
    });

    console.log(`Sample snapshot saved to Firestore with ID: ${docRef.id}`);

    return NextResponse.json({
      message: 'Sample snapshot created successfully.',
      snapshotId: docRef.id,
    });

  } catch (error: any) {
    console.error('Failed to create sample snapshot:', error);
    return NextResponse.json(
      { message: `Failed to create sample snapshot: ${error.message}` },
      { status: 500 }
    );
  }
}
```

2. **Configure Firestore rules:**
```javascript
// In Firebase Console > Firestore > Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /snapshots/{snapshotId} {
      // Allow authenticated users to create and read their own snapshots
      allow create: if request.auth != null;
      allow read: if request.auth != null;
    }
  }
}
```

### Option 3: Disable in Production

If the sample-snapshot feature is only for development/testing, disable it in production.

#### Implementation

Update `src/app/api/sample-snapshot/route.ts`:

```typescript
export async function POST(request: Request) {
  // Disable in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { 
        message: 'Sample snapshot feature is only available in development mode.',
        hint: 'Use Cloud Storage or Firestore for persistent storage in production.'
      },
      { status: 503 }
    );
  }

  // ... existing development code
}
```

### Option 4: In-Memory Storage (Not Recommended)

Store snapshots temporarily in memory. **Note:** This is lost on every container restart and is not shared between instances.

```typescript
// Global in-memory store (not recommended for production)
const snapshotStore = new Map<string, any>();

export async function POST(request: Request) {
  // ... validation code
  
  const id = `${outputName}-${Date.now()}`;
  snapshotStore.set(id, finalJson);
  
  return NextResponse.json({
    message: 'Sample snapshot created successfully (in-memory).',
    snapshotId: id,
    warning: 'This snapshot is stored in memory and will be lost on container restart.'
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id || !snapshotStore.has(id)) {
    return NextResponse.json({ message: 'Snapshot not found' }, { status: 404 });
  }
  
  return NextResponse.json(snapshotStore.get(id));
}
```

## Comparison Table

| Option | Pros | Cons | Use Case |
|--------|------|------|----------|
| **Google Cloud Storage** | Durable, scalable, cost-effective, public URLs | Requires GCS setup | Production (recommended) |
| **Firestore** | Already integrated, real-time, structured | Size limits (1MB per doc), costs for large files | Development, small files |
| **Disable in Production** | Simple, no changes needed | Feature not available | If not needed in production |
| **In-Memory** | Fast, no external dependencies | Lost on restart, not shared | Testing only (not recommended) |

## Recommendation

**For Production:** Use **Option 1 (Google Cloud Storage)**
- Most scalable and reliable
- Industry standard for file storage in serverless environments
- Easy to implement with provided code

**For Development/Testing:** Use **Option 2 (Firestore)** or **Option 3 (Disable)**
- Firestore if you want to test the feature
- Disable if the feature is not critical for production

## Implementation Checklist

- [ ] Choose migration option based on your use case
- [ ] Implement code changes for chosen option
- [ ] Test locally with the new implementation
- [ ] Deploy to Cloud Run
- [ ] Verify the endpoint works correctly
- [ ] Update any client applications using this endpoint
- [ ] Document the new behavior for your team

## Testing the Migration

After implementing your chosen option, test with:

```bash
# Test the endpoint
curl -X POST https://ipbuilder.homerdev.com/api/sample-snapshot \
  -H "Content-Type: application/json" \
  -d '{
    "outputName": "test-snapshot",
    "snapshotData": {
      "files": {
        "test/file.txt": "content"
      }
    }
  }'
```

Expected response:
- **GCS**: Returns `snapshotUrl` and `snapshotPath`
- **Firestore**: Returns `snapshotId`
- **Disabled**: Returns 503 error with message

## Additional Resources

- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Cloud Run Storage Best Practices](https://cloud.google.com/run/docs/storing-data)

## Support

For questions or issues with the migration, contact your infrastructure team or refer to the main DEPLOYMENT.md guide.
