FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/
RUN npm install --workspace apps/api --include-workspace-root=false || npm install --prefix apps/api

COPY apps/api apps/api
RUN cd apps/api && npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
