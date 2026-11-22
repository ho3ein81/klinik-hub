# ---- Base ----
# Same base image as klinik-server so the two share layers on the host.
# Alpine is safe here: package-lock.json carries genuine musl prebuilds for
# every native dependency (@next/swc, @tailwindcss/oxide, lightningcss), so
# nothing compiles from source and no build toolchain is needed. No apk
# packages either — libc6-compat is a shim for glibc-linked binaries, which
# musl-native prebuilds are not, so installing it would only add a needless
# dependency on the Alpine package CDN at build time.
FROM node:22.11.0-alpine3.20 AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- Install + build ----
# NODE_ENV is deliberately left unset in this stage: `npm ci` under
# NODE_ENV=production drops devDependencies, and `next build` needs
# typescript, tailwindcss and @tailwindcss/postcss, all of which are dev deps.
FROM base AS build

COPY package.json package-lock.json ./
# --no-audit --no-fund skip two registry round-trips that contribute nothing to
# the artifact. They are not just an optimisation: on a network that allows the
# package CDN but not the audit endpoint, the audit call hangs and npm reports
# the failure as the misleading "Exit handler never called!".
RUN npm ci --no-audit --no-fund

# NEXT_PUBLIC_* are inlined into the bundles by webpack at build time, so they
# have to be real environment variables here — an ARG alone is invisible to
# process.env. Declared after `npm ci` so changing a value doesn't invalidate
# the dependency layer.
#
# NEXT_PUBLIC_CLINIC_ID is the UUID of the clinic this portal fronts; every
# public API call sends it. It only exists once a clinic has been created, so
# a first deployment builds this image twice — see DEPLOY.md.
#
# NEXT_PUBLIC_SITE_URL is this site's own public origin. Canonical links, the
# sitemap and Open Graph tags must be absolute URLs, so a wrong value here tells
# search engines the real page lives somewhere else.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_CLINIC_ID
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_CLINIC_ID=$NEXT_PUBLIC_CLINIC_ID
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION

COPY . .

# This app has no public/ directory, so the runtime COPY below would fail.
# Creating it keeps that COPY unconditional and makes it pick up real assets
# automatically if any are added later.
RUN mkdir -p public

RUN npm run build

# Guards against a silent `output: 'standalone'` regression: without this the
# runtime stage would copy an empty directory and fail only at container start.
RUN test -f .next/standalone/server.js

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
# nginx proxies to patient:3002.
ENV PORT=3002
# Docker injects HOSTNAME=<container id> by default and the generated
# server.js does `process.env.HOSTNAME || '0.0.0.0'`, so without this the
# server binds to the container id and nginx cannot reach it.
ENV HOSTNAME=0.0.0.0

# .next/standalone is rooted at the app dir (package-lock.json at /app is the
# topmost lockfile), so its contents land directly in /app: server.js,
# package.json, the traced production node_modules, and .next/server.
COPY --from=build --chown=node:node /app/.next/standalone ./
# standalone never includes .next/static — that's the JS and CSS the browser
# downloads. Without it every page loads unstyled and un-hydrated.
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Belt and braces: the compiled bundle carries messages/*.json as traced
# webpack chunks and never reads these at runtime. Kept because it costs 32 KB
# and becomes load-bearing if this app ever moves to Turbopack or loads the
# JSON through fs. /app/messages is the path src/i18n/request.ts resolves to.
COPY --from=build --chown=node:node /app/messages ./messages

# The ISR / fetch cache is written at runtime and must be writable by `node`.
RUN mkdir -p .next/cache && chown -R node:node .next

# uid 1000, already present in node:*-alpine. Every COPY above is
# --chown=node:node, so no recursive chown of node_modules is needed.
USER node

EXPOSE 3002

# Next's start-server registers SIGINT/SIGTERM handlers, so node as PID 1
# shuts down cleanly — no tini/dumb-init required.
CMD ["node", "server.js"]
