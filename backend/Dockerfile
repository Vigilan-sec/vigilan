# Stage 1: Install dependencies
FROM python:3.12-slim AS builder

WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Production image
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/
COPY run_docker.py .

# Create directories for volume mounts
RUN mkdir -p /data/eve /data/db

EXPOSE 8000

CMD ["python", "run_docker.py"]
