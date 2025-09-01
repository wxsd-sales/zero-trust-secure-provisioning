FROM node:18.20.3-slim AS build
LABEL authors="William Mills"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --loglevel verbose

COPY . ./
RUN npm run build
RUN npm install fastify-cli --global


CMD ["fastify", "start", "-l", "info" , "dist/server.js"]
