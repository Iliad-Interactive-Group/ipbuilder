#!/bin/bash

# Setup Google Secret Manager for Cloud Run deployment
# This script configures Secret Manager access for the ipbuilder Cloud Run service

set -e

PROJECT_ID="ipbuilderai"
SECRET_NAME="GOOGLE_GENAI_API_KEY"
REGION="us-west1"

echo "🔧 Setting up Secret Manager for IPBuilder deployment..."

# Get the Cloud Run service account
echo "📋 Getting Cloud Run service account..."
SERVICE_ACCOUNT=$(gcloud run services describe ipbuilder \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(spec.template.spec.serviceAccountName)' 2>/dev/null || echo "")

if [ -z "$SERVICE_ACCOUNT" ]; then
  echo "⚠️  Cloud Run service not found or using default service account"
  SERVICE_ACCOUNT="${PROJECT_ID}@appspot.gserviceaccount.com"
  echo "   Using default App Engine service account: $SERVICE_ACCOUNT"
else
  echo "   Found service account: $SERVICE_ACCOUNT"
fi

# Verify the secret exists
echo ""
echo "🔍 Verifying secret exists..."
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
  echo "   ✅ Secret '$SECRET_NAME' found"
else
  echo "   ❌ Secret '$SECRET_NAME' not found!"
  echo ""
  echo "Please create the secret first:"
  echo "gcloud secrets create $SECRET_NAME --project=$PROJECT_ID --replication-policy=automatic"
  exit 1
fi

# Grant Secret Manager Secret Accessor role to the service account
echo ""
echo "🔐 Granting Secret Manager access to service account..."
gcloud secrets add-iam-policy-binding $SECRET_NAME \
  --project=$PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

echo ""
echo "✅ Secret Manager setup complete!"
echo ""
echo "The Cloud Run service account can now access the secret."
echo "Deploy your application to apply the changes:"
echo ""
echo "  gcloud builds submit --config=cloudbuild.yaml --project=$PROJECT_ID"
echo ""
