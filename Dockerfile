FROM node:24 AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

ENV APP_PATH=/home/node/app
WORKDIR $APP_PATH

RUN chown -R node:node $APP_PATH

USER node

FROM base AS development

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
  jq \
  make \
  g++ \
  python3 \
  vim \
  curl \
  python3-pip \
  && rm -rf /var/lib/apt/lists/*

USER node

FROM base AS build

ARG PROD_PATH=/home/node/prod

COPY --chown=node:node package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY --chown=node:node packages/oer-adapter-core/package.json ./packages/oer-adapter-core/
COPY --chown=node:node packages/oer-adapter-nostr-amb-relay/package.json ./packages/oer-adapter-nostr-amb-relay/
COPY --chown=node:node packages/oer-adapter-arasaac/package.json ./packages/oer-adapter-arasaac/
COPY --chown=node:node packages/oer-adapter-openverse/package.json ./packages/oer-adapter-openverse/
COPY --chown=node:node packages/oer-adapter-rpi-virtuell/package.json ./packages/oer-adapter-rpi-virtuell/
COPY --chown=node:node packages/oer-adapter-wikimedia/package.json ./packages/oer-adapter-wikimedia/

RUN pnpm install

# Copy source code for building
COPY --chown=node:node packages/ ./packages/
COPY --chown=node:node src/ ./src/
COPY --chown=node:node tsconfig.json tsconfig.build.json nest-cli.json ./

# Build all adapter packages (Vite) and main NestJS app
RUN pnpm run build

# Create a standalone production bundle with only prod dependencies.
# Workspace adapters are resolved using their "files" field (dist/ only).
RUN pnpm --filter @edufeed-org/oer-proxy deploy --prod $PROD_PATH

# Remove non-runtime files (root package has no "files" field, so everything gets copied)
RUN rm -rf $PROD_PATH/src $PROD_PATH/test $PROD_PATH/scripts \
     $PROD_PATH/tsconfig* $PROD_PATH/nest-cli.json \
     $PROD_PATH/.eslint* $PROD_PATH/.prettier* $PROD_PATH/.editorconfig \
     $PROD_PATH/*.config.* $PROD_PATH/CLAUDE.md $PROD_PATH/.claude

FROM node:24-slim AS production

ARG PROD_PATH=/home/node/prod
ENV NODE_ENV=production
WORKDIR /app

# Copy production bundle as root (read-only for the running process).
# If the app is compromised, an attacker cannot modify application code.
COPY --from=build $PROD_PATH .

# Only grant the node user ownership of directories that need write access at runtime.
# Application code stays root-owned and read-only.
RUN mkdir -p /app/tmp && chown node:node /app/tmp

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]
