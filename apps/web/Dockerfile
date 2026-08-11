FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY src ./src
ARG VITE_API_URL=""
ARG VITE_WEB_URL=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEB_URL=$VITE_WEB_URL
RUN npm run build

FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
