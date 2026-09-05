# syntax=docker/dockerfile:1
# =============================================================================
# Stage 1: Build Next.js Static Export
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root workspace package files and build scripts
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
COPY database/package.json ./database/
COPY scripts ./scripts

# Install dependencies without running dev hooks
RUN npm install --ignore-scripts

# Copy frontend source code
COPY frontend ./frontend

# Build frontend static export (generates frontend/out)
ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_SOCKET_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL} \
    NODE_ENV=production

RUN npm run build:frontend

# =============================================================================
# Stage 2: Serve with Nginx
# =============================================================================
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy static export files from builder stage
COPY --from=builder /app/frontend/out /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
