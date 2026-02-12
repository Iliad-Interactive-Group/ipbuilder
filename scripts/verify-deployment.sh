#!/bin/bash
# Cloud Run Deployment Verification Script
# This script helps verify that all aspects of the Cloud Run deployment are working correctly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="${SERVICE_NAME:-ipbuilder}"
REGION="${REGION:-us-central1}"
DOMAIN="${DOMAIN:-ipbuilder.homerdev.com}"

echo "================================================"
echo "Cloud Run Deployment Verification"
echo "================================================"
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if gcloud is installed
echo "1. Checking prerequisites..."
if command -v gcloud &> /dev/null; then
    print_status 0 "gcloud CLI is installed"
else
    print_status 1 "gcloud CLI is not installed"
    echo "   Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
if gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
    print_status 0 "Logged in as: $ACCOUNT"
else
    print_status 1 "Not logged in to gcloud"
    echo "   Run: gcloud auth login"
    exit 1
fi

echo ""
echo "2. Checking Cloud Run service..."

# Check if service exists
if gcloud run services describe $SERVICE_NAME --region=$REGION &> /dev/null; then
    print_status 0 "Service '$SERVICE_NAME' exists in region '$REGION'"
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
    print_info "Service URL: $SERVICE_URL"
    
    # Get latest revision
    REVISION=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.latestCreatedRevisionName)')
    print_info "Latest revision: $REVISION"
    
    # Get image
    IMAGE=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].image)')
    print_info "Image: $IMAGE"
else
    print_status 1 "Service '$SERVICE_NAME' not found in region '$REGION'"
    echo "   Deploy first using: gcloud run deploy $SERVICE_NAME --source ."
    exit 1
fi

echo ""
echo "3. Testing health endpoint..."

# Test health endpoint via Cloud Run URL
if curl -s -f -m 10 "$SERVICE_URL/api/health" > /dev/null; then
    HEALTH_RESPONSE=$(curl -s "$SERVICE_URL/api/health")
    print_status 0 "Health check passed (Cloud Run URL)"
    print_info "Response: $HEALTH_RESPONSE"
else
    print_status 1 "Health check failed (Cloud Run URL)"
fi

echo ""
echo "4. Checking domain mapping..."

# Check if domain mapping exists
if gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION &> /dev/null 2>&1; then
    print_status 0 "Domain mapping exists for '$DOMAIN'"
    
    # Get mapping status
    MAPPING_STATUS=$(gcloud run domain-mappings describe --domain=$DOMAIN --region=$REGION --format='json' | grep -o '"conditions".*' | head -1)
    print_info "Checking SSL certificate status..."
    
    # Test HTTPS endpoint
    if curl -s -f -m 10 "https://$DOMAIN/api/health" > /dev/null; then
        DOMAIN_HEALTH=$(curl -s "https://$DOMAIN/api/health")
        print_status 0 "Domain is accessible via HTTPS"
        print_info "Response: $DOMAIN_HEALTH"
    else
        print_status 1 "Domain is not accessible via HTTPS (SSL may still be provisioning)"
        print_info "This can take up to 24 hours for new domains"
    fi
    
    # Check DNS
    print_info "Checking DNS resolution..."
    if nslookup $DOMAIN &> /dev/null; then
        DNS_RESULT=$(nslookup $DOMAIN | grep "Address:" | tail -1 | awk '{print $2}')
        print_status 0 "DNS resolves to: $DNS_RESULT"
    else
        print_status 1 "DNS resolution failed"
    fi
else
    print_status 1 "Domain mapping not found for '$DOMAIN'"
    echo "   Create with: gcloud run domain-mappings create --service=$SERVICE_NAME --domain=$DOMAIN --region=$REGION"
fi

echo ""
echo "5. Checking environment configuration..."

# Check if required secrets exist
SECRETS=("GOOGLE_GENAI_API_KEY" "NEXT_PUBLIC_FIREBASE_API_KEY" "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "NEXT_PUBLIC_FIREBASE_PROJECT_ID")
for SECRET in "${SECRETS[@]}"; do
    if gcloud secrets describe $SECRET &> /dev/null; then
        print_status 0 "Secret '$SECRET' exists"
    else
        print_status 1 "Secret '$SECRET' not found"
    fi
done

echo ""
echo "6. Checking service configuration..."

# Check memory and CPU
MEMORY=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].resources.limits.memory)')
CPU=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containers[0].resources.limits.cpu)')
print_info "Memory: $MEMORY"
print_info "CPU: $CPU"

# Check concurrency
CONCURRENCY=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.spec.containerConcurrency)')
print_info "Concurrency: $CONCURRENCY"

# Check min/max instances
MIN_INSTANCES=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.metadata.annotations."autoscaling.knative.dev/minScale")')
MAX_INSTANCES=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(spec.template.metadata.annotations."autoscaling.knative.dev/maxScale")')
print_info "Min instances: ${MIN_INSTANCES:-0}"
print_info "Max instances: ${MAX_INSTANCES:-100}"

echo ""
echo "7. Checking recent logs..."
print_info "Fetching last 10 log entries..."
gcloud run services logs read $SERVICE_NAME --region=$REGION --limit=10 --format="table(timestamp,severity,textPayload)" 2>/dev/null || print_status 1 "Could not fetch logs"

echo ""
echo "================================================"
echo "Verification Summary"
echo "================================================"

# Test all endpoints
echo ""
print_info "Testing API endpoints..."

# Test ingest-strategy
echo "  - Testing /api/ingest-strategy..."
INGEST_STATUS=$(curl -o /dev/null -s -w "%{http_code}" -X OPTIONS "$SERVICE_URL/api/ingest-strategy")
if [ "$INGEST_STATUS" = "204" ]; then
    print_status 0 "  /api/ingest-strategy is accessible"
else
    print_status 1 "  /api/ingest-strategy returned status: $INGEST_STATUS"
fi

# Test sample-snapshot
echo "  - Testing /api/sample-snapshot..."
SAMPLE_STATUS=$(curl -o /dev/null -s -w "%{http_code}" "$SERVICE_URL/api/sample-snapshot")
if [ "$SAMPLE_STATUS" = "400" ]; then
    print_status 0 "  /api/sample-snapshot is accessible (400 = missing data, as expected)"
elif [ "$SAMPLE_STATUS" = "503" ]; then
    print_status 0 "  /api/sample-snapshot is accessible but disabled in production (503)"
    print_info "  This is expected if the endpoint was migrated to disable filesystem writes"
else
    print_status 1 "  /api/sample-snapshot returned unexpected status: $SAMPLE_STATUS"
fi

echo ""
echo "================================================"
echo "Deployment verification complete!"
echo ""
echo "Next steps:"
echo "  - If domain is not accessible, check DNS records in your domain provider"
echo "  - If SSL is not provisioned, wait up to 24 hours"
echo "  - View detailed logs: gcloud run services logs tail $SERVICE_NAME --region=$REGION"
echo "  - Update service: gcloud run deploy $SERVICE_NAME --image=IMAGE --region=$REGION"
echo "================================================"
