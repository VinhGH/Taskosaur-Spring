# Docker Setup Guide (Java Spring Boot & Next.js)

Comprehensive guide to run Taskosaur in production and development mode using Docker Compose.

---

> [!NOTE]
> ### 📜 Attribution Notice
> Based on the original Docker architecture of [Taskosaur/Taskosaur](https://github.com/Taskosaur/Taskosaur), updated to orchestrate the **Java 25 Spring Boot backend**, **Next.js Nginx frontend**, **PostgreSQL 16**, and **Portainer management dashboard**.

---

## 📁 Key Docker Files

| File | Purpose |
| :--- | :--- |
| **`docker-compose.spring.yml`** | Production orchestration for Java Spring Boot + Next.js Nginx + PostgreSQL |
| **`backend/Dockerfile`** | Multi-stage build for Java 25 Spring Boot (Temurin 25 JDK -> JRE) |
| **`frontend/Dockerfile`** | Multi-stage build for Next.js (Static Export -> Nginx Web Server) |
| **`docker/nginx.conf`** | Nginx reverse proxy configuration (port 80 -> Spring Boot port 3000) |
| **`docker/db-migrate.Dockerfile`** | Automated PostgreSQL schema migration runner |
| **`docker-compose.dev.yml`** | Local development orchestration with hot reloading |

---

## 🚀 1. Production Deployment (Recommended)

### Step 1: Configure Environment Variables
Create a `.env` file in the root directory:
```bash
# Database
POSTGRES_USER=taskosaur
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=taskosaur

# Web Server & Domain
APP_PORT=80
FRONTEND_URL=http://your-domain.com
CORS_ORIGIN=http://your-domain.com

# Security Keys
JWT_SECRET=your_long_secure_jwt_secret_key_here
JWT_ACCESS_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### Step 2: Start All Services
```bash
docker compose -f docker-compose.spring.yml up -d --build
```

### Step 3: Access Application
- **Taskosaur Web App:** `http://your-domain.com` (Port 80)
- **Spring Boot REST API:** `http://your-domain.com/api`
- **Portainer GUI Dashboard:** `http://your-domain.com:9000`

---

## 🛠️ 2. Useful Management Commands

### View Live Logs
```bash
# Spring Boot (Java) logs
docker compose -f docker-compose.spring.yml logs -f backend

# Frontend (Nginx) logs
docker compose -f docker-compose.spring.yml logs -f frontend

# Database logs
docker compose -f docker-compose.spring.yml logs -f postgres
```

### Check Container Status & Resource Usage
```bash
# Status table
docker compose -f docker-compose.spring.yml ps

# Real-time CPU & RAM usage
docker stats
```

### Restart / Stop Services
```bash
# Restart entire stack
docker compose -f docker-compose.spring.yml restart

# Restart Spring Boot only
docker compose -f docker-compose.spring.yml restart backend

# Stop all containers
docker compose -f docker-compose.spring.yml down
```

---

## 🔄 3. CI/CD Update Workflow

To update the running production server with the latest code from GitHub:
```bash
git pull origin dev
docker compose -f docker-compose.spring.yml up -d --build
```
*(Docker layer caching ensures only modified services are rebuilt, resulting in fast, zero-downtime updates).*
