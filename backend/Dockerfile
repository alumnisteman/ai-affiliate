FROM node:20-alpine

# Install openssl3 yang dibutuhkan oleh Prisma engine di Alpine Linux
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

EXPOSE 8080

# Start script that runs migrations then starts the app
CMD ["node", "dist/src/index.js"]
