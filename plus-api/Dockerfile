# DentCast Plus API — production container (ArvanCloud Cloud Container).
#
# IMPORTANT: build with the REPO ROOT as the context (not plus-api/), because the
# image must include plus/content-index.json — the API reads it for the dashboard
# navigation tree and topic rollups — and plus/pathways.json, for the learning
# pathways. Build command, run from the repo root:
#
#     docker build -f plus-api/Dockerfile -t dentcast-plus-api .
#
# Multi-stage: compile TypeScript with dev deps, then ship a slim runtime image
# with prod deps only. Node 20 (package.json engines) has global fetch, which the
# SMS.ir OTP provider relies on.

# ---- build stage -----------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY plus-api/package.json plus-api/package-lock.json ./
RUN npm ci
COPY plus-api/tsconfig.json ./
COPY plus-api/src ./src
RUN npm run build

# ---- runtime stage ---------------------------------------------------------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
# The content index, pathway definitions and badge catalog are baked in (see COPY below).
ENV CONTENT_INDEX_PATH=/app/content-index.json
ENV PATHWAYS_PATH=/app/pathways.json
ENV BADGES_PATH=/app/badges.json
ENV QUOTA_PATH=/app/quota.json
ENV LIBRARY_CATALOG_PATH=/app/library-catalog.json
# ...and where to refresh them from while the container runs, so publishing an
# article no longer means building an image. The baked copies above stay the
# boot value and the fallback; these are only ever an upgrade. Both mirrors are
# listed because they fail independently (Arvan vs Cloudflare).
ENV CONTENT_INDEX_URL=https://dentcast.ir/plus/content-index.json,https://dentcast.org/plus/content-index.json
ENV PATHWAYS_URL=https://dentcast.ir/plus/pathways.json,https://dentcast.org/plus/pathways.json
ENV BADGES_URL=https://dentcast.ir/plus/badges.json,https://dentcast.org/plus/badges.json
ENV QUOTA_URL=https://dentcast.ir/plus/quota.json,https://dentcast.org/plus/quota.json
ENV LIBRARY_CATALOG_URL=https://dentcast.ir/dentcast_cabinet_full_catalog.json,https://dentcast.org/dentcast_cabinet_full_catalog.json
WORKDIR /app

# Prod dependencies only.
COPY plus-api/package.json plus-api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled app, the migrations the entrypoint runs before boot, and the taxonomy
# index the dashboard/topic routes read.
COPY --from=build /app/dist ./dist
COPY plus-api/migrations ./migrations
COPY plus/content-index.json ./content-index.json
COPY plus/pathways.json ./pathways.json
COPY plus/badges.json ./badges.json
COPY plus/quota.json ./quota.json
# The link map the browser never receives (see src/library.ts).
COPY dentcast_cabinet_full_catalog.json ./library-catalog.json

# Build stamp — what GET /health reports back.
#
# Deliberately the LAST layer before USER/CMD: these values change on every
# build, so putting them earlier would invalidate the npm ci and COPY layers
# above and turn every rebuild into a cold one.
#
# Defaults keep a local `docker build` (and `npm run dev`, which never sees
# these at all) working without passing anything. The real values come from
# --build-arg; see the deploy notes in DEPLOY.md.
ARG BUILD_TAG=dev
ARG GIT_SHA=unknown
ARG BUILT_AT=unknown
ENV BUILD_TAG=$BUILD_TAG
ENV GIT_SHA=$GIT_SHA
ENV BUILT_AT=$BUILT_AT

# Don't run as root.
USER node

EXPOSE 8787

# Apply any pending DB migrations, then start the API. `migrate` reads the same
# DATABASE_URL as the app, so the managed Postgres schema is always current.
CMD ["sh", "-c", "npm run migrate && node dist/index.js"]
