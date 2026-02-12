# Cloud Run Quick Reference

## Quick Commands

### Build and Test Locally

```bash
# Build Docker image
docker build -t ipbuilder-local .

# Run locally
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e GOOGLE_GENAI_API_KEY=your-key \
  ipbuilder-local

# Test health check
curl http://localhost:8080/api/health
```

### Deploy to Cloud Run

```bash
# One-command deploy (after building)
gcloud run deploy ipbuilder \
  --source . \
  --region=us-central1 \
  --allow-unauthenticated

# Or with Docker image
docker build -t gcr.io/${PROJECT_ID}/ipbuilder:latest .
docker push gcr.io/${PROJECT_ID}/ipbuilder:latest
gcloud run deploy ipbuilder \
  --image=gcr.io/${PROJECT_ID}/ipbuilder:latest \
  --region=us-central1
```

### View Logs

```bash
# Tail logs
gcloud run services logs tail ipbuilder --region=us-central1

# Last 100 entries
gcloud run services logs read ipbuilder --region=us-central1 --limit=100
```

### Update Environment Variables

```bash
# Set environment variable
gcloud run services update ipbuilder \
  --update-env-vars KEY=VALUE \
  --region=us-central1

# Set from secret
gcloud run services update ipbuilder \
  --update-secrets=KEY=SECRET_NAME:latest \
  --region=us-central1
```

### Domain Management

```bash
# Add domain mapping
gcloud run domain-mappings create \
  --service=ipbuilder \
  --domain=ipbuilder.homerdev.com \
  --region=us-central1

# Check status
gcloud run domain-mappings describe \
  --domain=ipbuilder.homerdev.com \
  --region=us-central1
```

### Rollback

```bash
# List revisions
gcloud run revisions list --service=ipbuilder --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic ipbuilder \
  --to-revisions=REVISION_NAME=100 \
  --region=us-central1
```

## Environment Variables

### Required

- `NODE_ENV=production`
- `GOOGLE_GENAI_API_KEY` (secret)
- `NEXT_PUBLIC_FIREBASE_*` (7 Firebase config variables)

### Optional

- `ALLOWED_ORIGINS` (comma-separated CORS origins)

## Health Check URL

```
https://ipbuilder.homerdev.com/api/health
```

## GitHub Actions Secrets

Required in repository settings:

- `GCP_PROJECT_ID`
- `WIF_PROVIDER`
- `WIF_SERVICE_ACCOUNT`

## Useful Links

- **Cloud Console**: https://console.cloud.google.com/run
- **GitHub Actions**: https://github.com/Iliad-Interactive-Group/ipbuilder/actions
- **Production URL**: https://ipbuilder.homerdev.com
