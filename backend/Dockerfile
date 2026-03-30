# ════════════════════════════════════════════════════════════════════
#  EuroVault Backend — Multi-stage Dockerfile
# ════════════════════════════════════════════════════════════════════
#
#  Stage 1 (builder) : installs all Python dependencies
#  Stage 2 (runtime) : lean production image (~200 MB)
#
#  Build:  docker build -t eurovault-api ./backend
#  Run:    docker run -p 8001:8001 --env-file .env eurovault-api
# ════════════════════════════════════════════════════════════════════

# ── Stage 1: dependency builder ──────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system deps required by reportlab / pillow / scikit-learn
RUN apt-get update && apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        libffi-dev \
        libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip \
 && pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: lean runtime image ──────────────────────────────────────
FROM python:3.11-slim AS runtime

LABEL maintainer="EuroVault Digital Solutions"
LABEL description="EuroVault FastAPI Backend — AI-Native FinTech Platform"
LABEL version="1.0.0"

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application source
COPY . .

# Create non-root user for security
RUN addgroup --system appgroup \
 && adduser  --system --ingroup appgroup appuser \
 && chown -R appuser:appgroup /app

USER appuser

# Expose API port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/api/health')" \
    || exit 1

# Start server
CMD ["uvicorn", "server:app", \
     "--host", "0.0.0.0", \
     "--port", "8001", \
     "--workers", "1", \
     "--loop", "asyncio"]
