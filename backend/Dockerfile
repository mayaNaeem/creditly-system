FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN node node_modules/prisma/build/index.js generate

COPY . .

RUN node node_modules/typescript/bin/tsc -p tsconfig.json

ENV PORT=5001
EXPOSE 5001

CMD ["node", "dist/start.js"]
