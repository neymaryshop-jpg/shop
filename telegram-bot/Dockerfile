FROM python:3.11-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache gcc musl-dev postgresql-dev

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S botuser && \
    adduser -S botuser -u 1001 -G botuser && \
    chown -R botuser:botuser /app

# Switch to non-root user
USER botuser

# Set environment variables
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1

# Create logs directory
RUN mkdir -p /app/logs

# Install requests for HTTP checks
RUN pip install requests

# Start the bot
CMD ["python", "monitor.py"]
