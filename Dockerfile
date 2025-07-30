# Stage 1: Build the frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app/samantha_ai_assistant/apps/samantha-web
COPY pnpm-lock.yaml .
COPY samantha_ai_assistant/apps/samantha-web/package.json .

RUN npm install -g pnpm && pnpm install --prod
COPY samantha_ai_assistant/apps/samantha-web/ .
RUN pnpm run build

# Stage 2: Build the backend
FROM python:3.9-slim-buster as backend-builder
WORKDIR /app/samantha_ai_assistant/apps/samantha-backend
COPY samantha_ai_assistant/apps/samantha-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY samantha_ai_assistant/apps/samantha-backend/ .

# Stage 3: Final image
FROM python:3.9-slim-buster
WORKDIR /app

# Install supervisor, serve, gunicorn, and uvicorn for production
RUN apt-get update && apt-get install -y supervisor && \
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