name: {{PROJECT_NAME}}-dev

services:
  db:
    image: postgres:16-alpine
    container_name: {{PROJECT_NAME}}-db-dev
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-{{POSTGRES_DB}}}
      POSTGRES_USER: ${POSTGRES_USER:-{{POSTGRES_USER}}}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-{{POSTGRES_PASSWORD}}}
    ports:
      - "${DB_PORT:-{{DB_PORT}}}:5432"
    volumes:
      - pgdata_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-{{POSTGRES_USER}}} -d ${POSTGRES_DB:-{{POSTGRES_DB}}}"]
      interval: 10s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: .
      dockerfile: docker/backend/Dockerfile
      target: dev
      args:
        APP_DIR: ${BACKEND_APP_DIR:-{{BACKEND_APP_DIR}}}
    container_name: {{PROJECT_NAME}}-backend-dev
    environment:
      DATABASE_URL: postgres://${POSTGRES_USER:-{{POSTGRES_USER}}}:${POSTGRES_PASSWORD:-{{POSTGRES_PASSWORD}}}@db:5432/${POSTGRES_DB:-{{POSTGRES_DB}}}
      NODE_ENV: development
      PORT: 3001
    ports:
      - "${BACKEND_PORT:-{{BACKEND_PORT}}}:3001"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./${BACKEND_APP_DIR:-{{BACKEND_APP_DIR}}}:/workspace
      - backend_node_modules:/workspace/node_modules
    command: sh -lc "${BACKEND_DEV_CMD:-{{BACKEND_DEV_CMD}}}"

  frontend:
    build:
      context: .
      dockerfile: docker/frontend/Dockerfile
      target: dev
      args:
        APP_DIR: ${FRONTEND_APP_DIR:-{{FRONTEND_APP_DIR}}}
    container_name: {{PROJECT_NAME}}-frontend-dev
    environment:
      NODE_ENV: development
      PORT: 3000
      VITE_API_BASE_URL: http://localhost:${BACKEND_PORT:-{{BACKEND_PORT}}}
    ports:
      - "${FRONTEND_PORT:-{{FRONTEND_PORT}}}:3000"
    depends_on:
      - backend
    volumes:
      - ./${FRONTEND_APP_DIR:-{{FRONTEND_APP_DIR}}}:/workspace
      - frontend_node_modules:/workspace/node_modules
    command: sh -lc "${FRONTEND_DEV_CMD:-{{FRONTEND_DEV_CMD}}}"

volumes:
  pgdata_dev:
  backend_node_modules:
  frontend_node_modules:

