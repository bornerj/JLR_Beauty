FROM node:20-alpine AS base
WORKDIR /workspace
ARG APP_DIR={{FRONTEND_APP_DIR}}

FROM base AS deps
COPY ${APP_DIR}/package*.json ./
RUN npm ci

FROM deps AS dev
COPY ${APP_DIR}/ ./
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

FROM deps AS build
COPY ${APP_DIR}/ ./
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /workspace
COPY --from=deps /workspace/package*.json ./
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=build /workspace/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start"]

