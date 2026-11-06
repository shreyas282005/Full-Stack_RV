# --- Stage 1: Build Frontend Assets ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build production bundle into /app/dist
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:alpine

# Copy custom Nginx configuration with reverse proxy for /api and /socket.io
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]

