# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create data directory for AOF files
RUN mkdir -p /app/data

# Expose Redis default port
EXPOSE 6379

# Set environment variables
ENV NODE_ENV=production \
    PORT=6379 \
    AOF_ENABLED=true \
    AOF_FILENAME=/app/data/appendonly.aof

# Volume for persistence
VOLUME ["/app/data"]

# Start the application
CMD ["node", "dist/index.js"]
