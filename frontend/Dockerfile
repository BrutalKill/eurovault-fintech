# ════════════════════════════════════════════════════════════════════
#  EuroVault Frontend — Multi-stage Dockerfile
# ════════════════════════════════════════════════════════════════════
#
#  Stage 1 (builder) : builds React production bundle
#  Stage 2 (runtime) : serves static files via Nginx (~25 MB)
#
#  Build:  docker build --build-arg REACT_APP_BACKEND_URL=https://api.eurovault.eu \
#                       -t eurovault-web ./frontend
#  Run:    docker run -p 3000:80 eurovault-web
# ════════════════════════════════════════════════════════════════════

# ── Stage 1: React build ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Copy dependency manifests first (layer caching)
COPY package.json yarn.lock* ./

# Install dependencies (yarn is faster & more deterministic)
RUN yarn install --frozen-lockfile --non-interactive

# Copy source and build
COPY . .

# Inject backend URL at build time
ARG REACT_APP_BACKEND_URL=http://localhost:8001
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV GENERATE_SOURCEMAP=false

RUN yarn build


# ── Stage 2: Nginx static server ─────────────────────────────────────
FROM nginx:1.26-alpine AS runtime

LABEL maintainer="EuroVault Digital Solutions"
LABEL description="EuroVault React Frontend — AI-Native FinTech Platform"

# Copy built bundle
COPY --from=builder /build/build /usr/share/nginx/html

# Copy custom Nginx config (SPA routing + security headers)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/index.html || exit 1

CMD ["nginx", "-g", "daemon off;"]
