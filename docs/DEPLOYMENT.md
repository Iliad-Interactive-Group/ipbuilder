# Cloud Run Deployment Guide for IPBuilder

This guide provides step-by-step instructions for deploying IPBuilder to Google Cloud Run with auto-deploy capabilities and custom domain mapping to `ipbuilder.homerdev.com`.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Backend Compatibility Analysis](#backend-compatibility-analysis)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Options](#deployment-options)
6. [Domain Mapping Setup](#domain-mapping-setup)
7. [Auto-Deploy Configuration](#auto-deploy-configuration)
8. [Verification Checklist](#verification-checklist)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

IPBuilder is a Next.js 15 application designed to run as a stateless container on Google Cloud Run. The application includes:

- **Frontend**: Next.js with React 18, Server-Side Rendering
- **API Routes**: RESTful endpoints for marketing data ingestion and health checks
- **AI Services**: Google Genkit with Gemini 2.0 Flash for content generation
- **Authentication**: Firebase Auth
- **State**: Stateless architecture with no local file persistence in production

### Key Components

- **Dockerfile**: Multi-stage build optimized for Cloud Run
- **Health Check**: `/api/health` endpoint for Cloud Run health monitoring
- **Auto-Deploy**: GitHub Actions workflow or Cloud Build triggers
- **Configuration**: Environment variables and secrets management

## Prerequisites

### Required Tools

- Google Cloud Platform account with billing enabled
- `gcloud` CLI installed and configured ([Installation Guide](https://cloud.google.com/sdk/docs/install))
- Docker installed locally (for testing)
- GitHub repository access
- Domain access for homerdev.com DNS configuration

### GCP Services to Enable

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
```

### Required Secrets

Create the following secrets in Google Cloud Secret Manager:

```bash
# Google AI API Key
echo -n "your-google-ai-api-key" | gcloud secrets create GOOGLE_GENAI_API_KEY --data-file=-

# Firebase Configuration
echo -n "your-firebase-api-key" | gcloud secrets create NEXT_PUBLIC_FIREBASE_API_KEY --data-file=-
echo -n "your-firebase-auth-domain" | gcloud secrets create NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --data-file=-
echo -n "your-firebase-project-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_PROJECT_ID --data-file=-
echo -n "your-firebase-storage-bucket" | gcloud secrets create NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --data-file=-
echo -n "your-firebase-sender-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --data-file=-
echo -n "your-firebase-app-id" | gcloud secrets create NEXT_PUBLIC_FIREBASE_APP_ID --data-file=-

# CORS Configuration (optional, comma-separated origins)
echo -n "https://ipbuilder.homerdev.com" | gcloud secrets create ALLOWED_ORIGINS --data-file=-
```

## Backend Compatibility Analysis

### Stateless API Routes ✅

The following endpoints are **Cloud Run compatible** (stateless):

1. **`/api/ingest-strategy`**
   - Processes form data and redirects
   - No persistent state required
   - CORS-enabled for external integrations
   - ✅ Fully compatible

2. **`/api/health`**
   - Simple health check endpoint
   - Returns JSON status
   - ✅ Fully compatible

### Filesystem Dependencies ⚠️

**`/api/sample-snapshot`** - This endpoint writes to local filesystem:
- **Current behavior**: Writes JSON files to `sampleoutput/` directory
- **Cloud Run limitation**: Ephemeral filesystem (data lost on container restart)
- **Recommended solutions**:
  1. **Google Cloud Storage**: Store snapshots in GCS bucket
  2. **Firestore**: Store as documents in Firebase/Firestore
  3. **Disable in production**: If not critical for production use

**Action Required**: Choose one of the solutions above before deploying to production. See [Migration Guide for Sample Snapshot](#migration-guide-for-sample-snapshot) below.

### AI/Genkit Services ✅

- Google Genkit flows are stateless
- All AI operations use external Google AI APIs
- ✅ Fully compatible with Cloud Run

## Environment Configuration

### Required Environment Variables

Create a `.env.production` file (do not commit) or configure in Cloud Run:

```env
# Node Environment
NODE_ENV=production

# Firebase Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google AI API Key (Secret)
GOOGLE_GENAI_API_KEY=your-google-ai-api-key

# CORS Configuration
ALLOWED_ORIGINS=https://ipbuilder.homerdev.com,https://homerdev.com
```

### Cloud Run Configuration

Recommended settings for production:

- **Memory**: 1GB (can scale to 2GB if needed)
- **CPU**: 1 vCPU
- **Min Instances**: 0 (cost optimization) or 1 (avoid cold starts)
- **Max Instances**: 10 (adjust based on traffic)
- **Timeout**: 300 seconds (5 minutes)
- **Port**: 8080 (default)
- **Concurrency**: 80 (default)

## Deployment Options

### Option 1: GitHub Actions (Recommended)

GitHub Actions provides automated deployments on every push to `main` branch.

#### Setup Steps

1. **Configure Workload Identity Federation** (preferred over service account keys):

```bash
# Create a Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create a Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Create a Service Account
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions Service Account"

# Grant necessary permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Allow GitHub to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/Iliad-Interactive-Group/ipbuilder"
```

2. **Add GitHub Secrets**:

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `WIF_PROVIDER`: `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- `WIF_SERVICE_ACCOUNT`: `github-actions-sa@PROJECT_ID.iam.gserviceaccount.com`

3. **Enable Workflow**:

The workflow at `.github/workflows/deploy-cloud-run.yml` will automatically deploy on push to `main`.

#### Manual Trigger

You can also trigger deployment manually from GitHub Actions UI or via GitHub CLI:

```bash
gh workflow run deploy-cloud-run.yml
```

### Option 2: Google Cloud Build

Cloud Build triggers can automatically deploy from GitHub commits.

#### Setup Steps

1. **Connect GitHub Repository**:

```bash
# Connect your repository (interactive)
gcloud builds connections create github github-connection --region=us-central1
```

2. **Create Build Trigger**:

```bash
gcloud builds triggers create github \
  --name="ipbuilder-deploy" \
  --repo-name="ipbuilder" \
  --repo-owner="Iliad-Interactive-Group" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region=us-central1
```

3. **Configure Service Account Permissions**:

```bash
PROJECT_NUMBER=$(gcloud projects describe ${PROJECT_ID} --format='value(projectNumber)')
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"
```

### Option 3: Manual Deployment

For testing or one-time deployments:

```bash
# Build the image
docker build -t gcr.io/${PROJECT_ID}/ipbuilder:latest .

# Push to GCR
docker push gcr.io/${PROJECT_ID}/ipbuilder:latest

# Deploy to Cloud Run
gcloud run deploy ipbuilder \
  --image=gcr.io/${PROJECT_ID}/ipbuilder:latest \
  --region=us-central1 \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=10 \
  --timeout=300 \
  --set-env-vars="NODE_ENV=production" \
  --set-secrets="GOOGLE_GENAI_API_KEY=GOOGLE_GENAI_API_KEY:latest,NEXT_PUBLIC_FIREBASE_API_KEY=NEXT_PUBLIC_FIREBASE_API_KEY:latest,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:latest,NEXT_PUBLIC_FIREBASE_PROJECT_ID=NEXT_PUBLIC_FIREBASE_PROJECT_ID:latest,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:latest,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:latest,NEXT_PUBLIC_FIREBASE_APP_ID=NEXT_PUBLIC_FIREBASE_APP_ID:latest"
```

## Domain Mapping Setup

### Step 1: Verify Domain Ownership

```bash
gcloud domains verify homerdev.com
```

### Step 2: Create Domain Mapping

```bash
gcloud run domain-mappings create \
  --service=ipbuilder \
  --domain=ipbuilder.homerdev.com \
  --region=us-central1
```

### Step 3: Configure DNS

The command above will provide DNS records to add. Typically, you'll need to add:

**A Record:**
```
Type: A
Name: ipbuilder
Value: [IP provided by Cloud Run]
TTL: 3600
```

**AAAA Record (IPv6):**
```
Type: AAAA
Name: ipbuilder
Value: [IPv6 provided by Cloud Run]
TTL: 3600
```

### Step 4: Verify Domain Mapping

```bash
gcloud run domain-mappings describe \
  --domain=ipbuilder.homerdev.com \
  --region=us-central1
```

Wait for SSL certificate to be provisioned (can take up to 24 hours, usually 15-60 minutes).

### Step 5: Test

```bash
curl https://ipbuilder.homerdev.com/api/health
```

## Auto-Deploy Configuration

### GitHub Actions Auto-Deploy

Auto-deploy is configured via `.github/workflows/deploy-cloud-run.yml`.

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Process:**
1. Checkout code
2. Authenticate to GCP via Workload Identity
3. Build Docker image
4. Push to Google Container Registry
5. Deploy to Cloud Run with secrets
6. Report deployment URL

**Monitoring:**
- View workflow runs: GitHub → Actions tab
- View logs: Click on specific workflow run
- Receive notifications: GitHub notifications or email

### Cloud Build Auto-Deploy

If using Cloud Build triggers:

**Triggers:**
- Push to `main` branch
- Manual trigger via Console or CLI

**Process:**
1. Build Docker image via `cloudbuild.yaml`
2. Push to GCR
3. Deploy to Cloud Run

**Monitoring:**
```bash
# View recent builds
gcloud builds list --limit=10

# View specific build logs
gcloud builds log [BUILD_ID]
```

## Migration Guide for Sample Snapshot

The `/api/sample-snapshot` endpoint currently writes to local filesystem, which is incompatible with Cloud Run's ephemeral storage. Here are migration options:

### Option 1: Google Cloud Storage (Recommended)

1. **Install GCS SDK**:
```bash
npm install @google-cloud/storage
```

2. **Update endpoint**:
```typescript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket('ipbuilder-snapshots');

// Replace fs.writeFile with:
const blob = bucket.file(`${outputName}-${timestamp}.json`);
await blob.save(JSON.stringify(finalJson, null, 2));
const publicUrl = `https://storage.googleapis.com/ipbuilder-snapshots/${blob.name}`;
```

3. **Create bucket**:
```bash
gsutil mb -l us-central1 gs://ipbuilder-snapshots
gsutil iam ch allUsers:objectViewer gs://ipbuilder-snapshots
```

### Option 2: Firestore

Store snapshots as documents in Firestore (already integrated with Firebase).

### Option 3: Disable in Production

If the endpoint is only for development:

```typescript
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Sample snapshot feature is disabled in production' },
      { status: 503 }
    );
  }
  // ... existing code
}
```

## Verification Checklist

Use this checklist to verify your deployment:

- [ ] **Local Docker Build**
  ```bash
  docker build -t ipbuilder-test .
  docker run -p 8080:8080 -e NODE_ENV=production ipbuilder-test
  curl http://localhost:8080/api/health
  ```

- [ ] **Cloud Run Deployment**
  - [ ] Service deployed successfully
  - [ ] Health check returns 200 OK
  - [ ] Environment variables/secrets configured
  - [ ] Service is accessible via Cloud Run URL

- [ ] **Domain Mapping**
  - [ ] DNS records configured in homerdev.com
  - [ ] Domain mapping created in Cloud Run
  - [ ] SSL certificate provisioned
  - [ ] HTTPS redirect working
  - [ ] App accessible at `https://ipbuilder.homerdev.com`

- [ ] **Auto-Deploy**
  - [ ] GitHub Actions workflow or Cloud Build trigger configured
  - [ ] Secrets/permissions set up correctly
  - [ ] Test deployment by pushing to main branch
  - [ ] Verify automatic deployment succeeds

- [ ] **Backend Compatibility**
  - [ ] `/api/ingest-strategy` working correctly
  - [ ] `/api/health` returning healthy status
  - [ ] `/api/sample-snapshot` migrated or disabled (if in production)
  - [ ] Firebase Auth working
  - [ ] AI generation working (Genkit + Gemini)

- [ ] **Performance & Monitoring**
  - [ ] Response times acceptable (<2s for health check)
  - [ ] Cold start times acceptable (<10s)
  - [ ] Logs visible in Cloud Logging
  - [ ] Error rates monitored
  - [ ] Set up alerts for errors/downtime

## Troubleshooting

### Docker Build Fails

**Issue**: Build fails with dependency errors

**Solution**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t ipbuilder .
```

### Deployment Times Out

**Issue**: Cloud Run deployment exceeds timeout

**Solution**: Increase timeout in cloudbuild.yaml or GitHub Actions:
```yaml
timeout: '1800s'  # 30 minutes
```

### Health Check Fails

**Issue**: Cloud Run reports unhealthy service

**Solution**:
```bash
# Check logs
gcloud run services logs read ipbuilder --region=us-central1 --limit=50

# Test health endpoint locally
docker run -p 8080:8080 gcr.io/${PROJECT_ID}/ipbuilder:latest
curl http://localhost:8080/api/health
```

### Secrets Not Loading

**Issue**: Environment variables not available in container

**Solution**:
```bash
# Verify secrets exist
gcloud secrets list

# Grant access to Cloud Run service account
gcloud secrets add-iam-policy-binding SECRET_NAME \
  --member="serviceAccount:SERVICE_ACCOUNT@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Domain Mapping Not Working

**Issue**: Domain returns 404 or DNS errors

**Solution**:
```bash
# Check domain mapping status
gcloud run domain-mappings describe --domain=ipbuilder.homerdev.com --region=us-central1

# Verify DNS propagation
dig ipbuilder.homerdev.com
nslookup ipbuilder.homerdev.com

# Check SSL certificate status
curl -vI https://ipbuilder.homerdev.com
```

### CORS Issues

**Issue**: External integrations fail with CORS errors

**Solution**: Ensure `ALLOWED_ORIGINS` secret/environment variable is set:
```bash
echo -n "https://ipbuilder.homerdev.com,https://external-app.com" | \
  gcloud secrets create ALLOWED_ORIGINS --data-file=-
```

## Monitoring and Logs

### View Logs

```bash
# Real-time logs
gcloud run services logs tail ipbuilder --region=us-central1

# Recent logs
gcloud run services logs read ipbuilder --region=us-central1 --limit=100
```

### Cloud Logging

View logs in Google Cloud Console:
- Navigation Menu → Logging → Logs Explorer
- Filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="ipbuilder"`

### Metrics

View metrics in Google Cloud Console:
- Navigation Menu → Cloud Run → ipbuilder → Metrics tab
- Monitor: Request count, latency, instance count, memory usage

### Set Up Alerts

```bash
# Example: Alert on error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="IPBuilder High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05 \
  --condition-threshold-duration=300s
```

## Cost Optimization

### Tips to Reduce Costs

1. **Set min-instances to 0** (avoid idle costs, accept cold starts)
2. **Adjust memory allocation** (1GB usually sufficient)
3. **Set appropriate max-instances** (prevent runaway scaling)
4. **Use Cloud Scheduler for health checks** (keeps 1 instance warm if needed)
5. **Monitor and optimize** (use Cloud Monitoring to track usage)

### Estimated Costs

**Typical production setup:**
- Memory: 1GB
- CPU: 1 vCPU
- Min instances: 0
- Max instances: 10
- Estimated traffic: 10,000 requests/month

**Cost**: ~$5-15/month (varies with traffic)

## Security Best Practices

1. **Never commit secrets** to repository
2. **Use Secret Manager** for all sensitive values
3. **Configure CORS properly** (no wildcards in production)
4. **Enable authentication** where appropriate
5. **Keep dependencies updated** (`npm audit` regularly)
6. **Review IAM permissions** (principle of least privilege)
7. **Enable Cloud Armor** (optional, for DDoS protection)

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Google Cloud Build](https://cloud.google.com/build/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [Cloud Run Domain Mapping](https://cloud.google.com/run/docs/mapping-custom-domains)

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review Cloud Run logs
3. Consult Google Cloud documentation
4. Contact your team's infrastructure lead
