# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma
COPY scripts ./scripts

RUN npm install --ignore-scripts

CMD ["npx", "prisma", "migrate", "deploy", "--schema=backend/prisma/schema.prisma"]
