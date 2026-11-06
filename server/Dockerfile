# BorrowBox Backend Dockerfile
FROM node:22-alpine

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package descriptors and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma Client binary bindings
ENV DATABASE_URL="postgresql://postgres:postgres@postgres:5432/borrowbox_dev?schema=public"
RUN npx prisma generate

# Copy application source code and entrypoint
COPY src ./src/
COPY docker-entrypoint.sh ./

# Ensure entrypoint script is executable
RUN chmod +x docker-entrypoint.sh

# Expose server port
EXPOSE 5000

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Container healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]

