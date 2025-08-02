# Stage 1: Build the frontend
FROM node:18-alpine as frontend-builder


WORKDIR /app

# Set PYTHONPATH to include the root of the application
ENV PYTHONPATH=/app
COPY apps/samantha-web/package.json ./apps/samantha-web/package.json


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
    fi; \
    pnpm store prune
COPY apps/samantha-web/ ./apps/samantha-web/

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
WORKDIR /app
COPY apps/samantha-backend/requirements.txt ./apps/samantha-backend/requirements.txt
RUN set -eux; \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! pip install --no-cache-dir -r apps/samantha-backend/requirements.txt && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "pip install failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "pip install failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi
COPY apps/samantha-backend/ ./apps/samantha-backend/

# Stage 3: Final image
FROM python:3.11-slim-bullseye
WORKDIR /app

# Install supervisor, serve, gunicorn, and uvicorn for production
RUN set -eux; \
    apt-get clean && \
    DEBIAN_FRONTEND=noninteractive apt-get update --fix-missing
RUN set -eux; \
    apt-get install -y apt-transport-https ca-certificates supervisor && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
RUN set -eux; \
    ATTEMPTS=0; \
    MAX_ATTEMPTS=5; \
    while ! pip install --no-cache-dir serve gunicorn uvicorn && [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do \
        ATTEMPTS=$((ATTEMPTS+1)); \
        echo "pip install failed. Retrying in 5 seconds... (Attempt $ATTEMPTS/$MAX_ATTEMPTS)"; \
        sleep 5; \
    done; \
    if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then \
        echo "pip install failed after $MAX_ATTEMPTS attempts."; \
        exit 1; \
    fi

# Copy built frontend from frontend-builder stage
COPY --from=frontend-builder /app/apps/samantha-web/dist ./apps/samantha-web/dist

# Copy built backend from backend-builder stage
COPY --from=backend-builder /app/apps/samantha-backend/ ./apps/samantha-backend

# Copy the entire project structure to maintain relative paths


COPY apps/samantha-backend/main.py /app/main.py
COPY . /app/samantha_ai_assistant

# Ensure __init__.py files exist to treat directories as Python packages
RUN touch \
    /app/samantha_ai_assistant/__init__.py \
    /app/samantha_ai_assistant/apps/__init__.py \
    /app/samantha_ai_assistant/apps/samantha-backend/__init__.py \
    /app/samantha_ai_assistant/packages/__init__.py \
    /app/samantha_ai_assistant/packages/voice_processing/__init__.py

# Install the samantha_ai_assistant package in editable mode
RUN pip install -e /app/samantha_ai_assistant

# Copy Procfile and supervisord.conf from the parent directory
COPY ../Procfile /app/Procfile
COPY ../supervisord.conf /app/supervisord.conf



# Expose port for the backend
EXPOSE 8000

# Command to run the application using Procfile
CMD ["/usr/bin/supervisord", "-c", "/app/supervisord.conf"]