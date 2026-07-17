# DentCast Plus API — production container (ArvanCloud Cloud Container).
#
# IMPORTANT: build with the REPO ROOT as the context (not plus-api/), because the
# image must include plus/content-index.json — the API reads it for the dashboard
# navigation tree and topic rollups. Build command, run from the repo root:
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
# The content index is baked in at /app/content-index.json (see COPY below).
ENV CONTENT_INDEX_PATH=/app/content-index.json
WORKDIR /app

# Prod dependencies only.
COPY plus-api/package.json plus-api/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled app, the migrations the entrypoint runs before boot, and the taxonomy
# index the dashboard/topic routes read.
COPY --from=build /app/dist ./dist
COPY plus-api/migrations ./migrations
COPY plus/content-index.json ./content-index.json

# Don't run as root.
USER node

EXPOSE 8787

# Apply any pending DB migrations, then start the API. `migrate` reads the same
# DATABASE_URL as the app, so the managed Postgres schema is always current.
CMD ["sh", "-c", "npm run migrate && node dist/index.js"]
