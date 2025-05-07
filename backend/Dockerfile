FROM python:3.9-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend directory
COPY . .

# Set PYTHONPATH to include the current directory
ENV PYTHONPATH=/app

# Expose the port
EXPOSE 8000

# Command to run the application
CMD ["python3", "main.py"]