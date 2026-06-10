FROM node:20-alpine AS base
WORKDIR /workspace
ARG APP_DIR={{BACKEND_APP_DIR}}

FROM base AS deps
COPY ${APP_DIR}/package*.json ./
RUN npm ci

FROM deps AS dev
COPY ${APP_DIR}/ ./
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY ${APP_DIR}/ ./
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /workspace
COPY --from=deps /workspace/package*.json ./
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist ./dist
EXPOSE 3001
CMD ["npm", "run", "start"]

