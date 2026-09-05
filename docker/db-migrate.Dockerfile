# syntax=docker/dockerfile:1
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY database/package.json ./database/
COPY database/prisma ./database/prisma
COPY scripts ./scripts

RUN npm install --ignore-scripts

CMD ["npx", "prisma", "migrate", "deploy", "--schema=database/prisma/schema.prisma"]
