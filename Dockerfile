FROM node:24 AS base

# Enable pnpm via corepack (recommended method)
RUN corepack enable && corepack prepare pnpm@latest --activate

ENV APP_PATH=/home/node/app
WORKDIR $APP_PATH

# Ensure the directory is owned by node user before switching
RUN chown -R node:node $APP_PATH

USER node

FROM base AS development

# Switch back to root to install system packages
USER root

RUN apt update && apt install -y \
  jq \
  postgresql-client \
  make \
  g++ \
  python3 \
  vim \
  curl \
  python3-pip

USER node

FROM base AS production

# Switch to root to install postgresql-client
USER root
RUN apt update && apt install -y postgresql-client && rm -rf /var/lib/apt/lists/*

USER node

COPY --chown=node:node package.json pnpm-workspace.yaml pnpm-lock.yaml $APP_PATH/
COPY --chown=node:node packages/oer-adapter-core $APP_PATH/packages/oer-adapter-core/
COPY --chown=node:node packages/oer-adapter-arasaac $APP_PATH/packages/oer-adapter-arasaac/
RUN pnpm install

COPY --chown=node:node src tsconfig.build.json tsconfig.json $APP_PATH/

RUN pnpm run build

COPY --chown=node:node entrypoint.prod.sh $APP_PATH/
RUN chmod +x entrypoint.prod.sh
CMD ["sh", "./entrypoint.prod.sh"]