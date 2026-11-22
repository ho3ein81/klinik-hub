# ---- Base ----
FROM node:22.11.0-alpine3.20 AS base
# Prisma's query engine needs OpenSSL; libc6-compat helps native addons
# (bcrypt, sharp) load correctly on musl libc.
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---- Install + build ----
FROM base AS build
# bcrypt falls back to compiling from source on some platforms.
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# --no-audit --no-fund skip two registry round-trips that contribute nothing to
# the artifact. They are not just an optimisation: on a network that allows the
# package CDN but not the audit endpoint, the audit call hangs and npm reports
# the failure as the misleading "Exit handler never called!".
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads

EXPOSE 5000

# Applies any pending migrations, then starts the API. Safe to run on every
# boot: `migrate deploy` is a no-op when the database is already current.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
