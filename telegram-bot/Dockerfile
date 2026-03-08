# Build stage
FROM python:3.9-slim AS builder

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.9-slim

ARG NO_PROXY
ARG HTTP_PROXY
ARG HTTPS_PROXY

ENV NO_PROXY=${NO_PROXY}
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Копирование установленных пакетов
COPY --from=builder /usr/local/lib/python3.9/site-packages /usr/local/lib/python3.9/site-packages
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD python -c "import sys; sys.exit(0)" || exit 1

CMD ["python", "main.py"]
