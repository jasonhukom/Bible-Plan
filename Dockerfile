FROM node:22-alpine AS web-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package.json ./package.json
RUN npm install
COPY server/tsconfig.json ./tsconfig.json
COPY server/*.ts ./
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package.json ./package.json
RUN npm install --omit=dev && npm cache clean --force
COPY --from=server-builder /app/server/dist ./dist
COPY --from=web-builder /app/dist ./public
EXPOSE 3000
CMD ["node", "dist/index.js"]


