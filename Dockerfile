FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM semtech/static-file-service:0.2.0
COPY --from=builder /app/dist /data
