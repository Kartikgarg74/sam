# Stage 1: Build the frontend
FROM node:18-alpine as frontend-builder


WORKDIR /app/samantha_ai_assistant/apps/samantha-web
COPY samantha_ai_assistant/apps/samantha-web/package.json /app/samantha_ai_assistant/apps/samantha-web/package.json


RUN set -eux; \
    npm install -g pnpm; \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! pnpm install --prod && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "pnpm install failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "pnpm install failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi
COPY samantha_ai_assistant/apps/samantha-web/ .

RUN set -eux; \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! pnpm run build && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "pnpm run build failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "pnpm run build failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi

# Stage 2: Build the backend
FROM python:3.11-slim-bullseye as backend-builder
WORKDIR /app/samantha_ai_assistant/apps/samantha-backend
COPY samantha_ai_assistant/apps/samantha-backend/requirements.txt .
RUN set -eux; \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! pip install --no-cache-dir -r requirements.txt && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "pip install failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "pip install failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi
COPY samantha_ai_assistant/apps/samantha-backend/ .

# Stage 3: Final image
FROM python:3.11-slim-bullseye
WORKDIR /app

# Install supervisor, serve, gunicorn, and uvicorn for production
RUN set -eux; \
    apt-get update && apt-get install -y apt-transport-https ca-certificates && \
    echo "deb https://deb.debian.org/debian bullseye main" > /etc/apt/sources.list && \
    echo "deb https://deb.debian.org/debian bullseye-updates main" >> /etc/apt/sources.list && \
    echo "deb https://security.debian.org/debian-security bullseye-security main" >> /etc/apt/sources.list && \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! DEBIAN_FRONTEND=noninteractive timeout 300 apt-get update && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "apt-get update failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "apt-get update failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi; \
    apt-get install -y supervisor && \
    apt-get clean && rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir serve gunicorn uvicorn

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/samantha_ai_assistant/apps/samantha-web/dist /app/samantha_ai_assistant/apps/samantha-web/dist

# Copy built backend from backend-builder stage
COPY --from=backend-builder /app/samantha_ai_assistant/apps/samantha-backend /app/samantha_ai_assistant/apps/samantha-backend

# Copy the entire project structure to maintain relative paths
COPY samantha_ai_assistant samantha_ai_assistant
COPY Procfile .
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port for the backend
EXPOSE 8000

# Command to run the application using Procfile
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]