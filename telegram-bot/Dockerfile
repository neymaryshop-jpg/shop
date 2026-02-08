FROM python:3.11-alpine
WORKDIR /app
RUN apk add --no-cache gcc musl-dev postgresql-dev
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN addgroup -g 1001 -S botuser && \
    adduser -S botuser -u 1001 -G botuser && \
    chown -R botuser:botuser /app
USER botuser
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
CMD ["python", "bot.py"]
