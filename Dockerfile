# Multi-stage Dockerfile for IPBuilder on Google Cloud Run
# Optimized for production deployment with minimal image size

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Copy package files for dev dependencies
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Set dummy Firebase config for build time (will be overridden at runtime)
# IMPORTANT: The value "build-time-placeholder" must match the check in src/firebase/client.ts:16
# to ensure Firebase is not initialized during build with invalid credentials
ENV NEXT_PUBLIC_FIREBASE_API_KEY="build-time-placeholder"
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="build-time-placeholder.firebaseapp.com"
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID="build-time-placeholder"
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="build-time-placeholder.appspot.com"
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="000000000000"
ENV NEXT_PUBLIC_FIREBASE_APP_ID="1:000000000000:web:0000000000000000000000"

# Build the Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Cloud Run sets PORT environment variable, default to 8080
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]
