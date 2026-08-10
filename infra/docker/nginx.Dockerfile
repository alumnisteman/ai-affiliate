# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Copy built frontend assets
COPY --from=builder /app/dist /var/www/html

# Copy Nginx configurations
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
COPY infra/nginx/conf.d /etc/nginx/conf.d

EXPOSE 80 443
