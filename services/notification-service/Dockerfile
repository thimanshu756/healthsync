FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user
RUN adduser --disabled-password --gecos '' appuser
USER appuser

# Copy application source
COPY src/ /app/src/

# Set Python path
ENV PYTHONPATH=/app

# Start the worker
CMD ["python", "src/main.py"]
