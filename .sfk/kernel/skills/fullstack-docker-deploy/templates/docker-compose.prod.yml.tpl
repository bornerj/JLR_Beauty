name: {{PROJECT_NAME}}-prod

services:
  db:
    image: postgres:16-alpine
    container_name: {{PROJECT_NAME}}-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-{{POSTGRES_DB}}}
      POSTGRES_USER: ${POSTGRES_USER:-{{POSTGRES_USER}}}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-{{POSTGRES_PASSWORD}}}
    volumes:
      - pgdata_prod:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-{{POSTGRES_USER}}} -d ${POSTGRES_DB:-{{POSTGRES_DB}}}"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: prod
      args:
        APP_DIR: ${BACKEND_APP_DIR:-{{BACKEND_APP_DIR}}}
    image: ${PROJECT_IMAGE_BACKEND:-{{PROJECT_NAME}}-backend}:${APP_VERSION:-latest}
    container_name: {{PROJECT_NAME}}-backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-{{POSTGRES_USER}}}:${POSTGRES_PASSWORD:-{{POSTGRES_PASSWORD}}}@db:5432/${POSTGRES_DB:-{{POSTGRES_DB}}}
      NODE_ENV: production
      PORT: 3001
    depends_on:
      db:
        condition: service_healthy
    expose:
      - "3001"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 8
    command: sh -lc "${BACKEND_PROD_CMD:-{{BACKEND_PROD_CMD}}}"

  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      target: prod
      args:
        APP_DIR: ${FRONTEND_APP_DIR:-{{FRONTEND_APP_DIR}}}
    image: ${PROJECT_IMAGE_FRONTEND:-{{PROJECT_NAME}}-frontend}:${APP_VERSION:-latest}
    container_name: {{PROJECT_NAME}}-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      API_BASE_URL: http://backend:3001
    depends_on:
      - backend
    expose:
      - "3000"
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:3000/ || exit 1"]
      interval: 15s
      timeout: 5s
      retries: 8
    command: sh -lc "${FRONTEND_PROD_CMD:-{{FRONTEND_PROD_CMD}}}"

  nginx:
    image: nginx:1.27-alpine
    container_name: {{PROJECT_NAME}}-nginx
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
    ports:
      - "80:80"
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  pgdata_prod:

