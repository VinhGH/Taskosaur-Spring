# Taskosaur (Java Spring Boot Edition)

<div align="center">
  <img src="https://raw.githubusercontent.com/Taskosaur/Taskosaur/main/frontend/public/taskosaur-logo.svg" alt="Taskosaur Logo" width="128">
  <h3>Open Source Project Management with Conversational AI Task Execution</h3>
  <p><i>Adapted with a high-performance Java Spring Boot backend & Next.js frontend</i></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Java-25%20LTS-orange.svg" alt="Java 25">
    <img src="https://img.shields.io/badge/Spring%20Boot-3.x%20%2F%204.x-brightgreen.svg" alt="Spring Boot">
    <img src="https://img.shields.io/badge/Next.js-16.1.1-black.svg" alt="Next.js">
    <img src="https://img.shields.io/badge/PostgreSQL-16-blue.svg" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Nginx-Reverse%20Proxy-green.svg" alt="Nginx">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" alt="Docker">
    <img src="https://img.shields.io/badge/i18n-6%20Languages-yellow.svg" alt="i18n">
    <img src="https://img.shields.io/badge/AI-OpenRouter-purple.svg" alt="AI Powered">
  </p>
</div>

---

> [!NOTE]
> ### 📜 Attribution & License Notice
> This project is an adaptation based on the original open-source project [**Taskosaur/Taskosaur**](https://github.com/Taskosaur/Taskosaur). 
> 
> While maintaining the original UI/UX design, conversational AI workflow, and PostgreSQL schema, this repository re-architects and ports the backend to **Java 25 Spring Boot (`backend`)** with JPA/Hibernate, JJWT security, multi-language i18n support, and a unified production Docker Compose stack (Spring Boot + Next.js Nginx + PostgreSQL).
> 
> All credit and copyright for the original design, branding, and concept belong to the [Taskosaur Team](https://github.com/Taskosaur).

---

## 🌟 Key Features

- ☕ **High-Performance Spring Boot Backend** - Re-implemented in Java 25 with Spring Data JPA, Hibernate, Spring Security, and JJWT.
- 🤖 **Conversational AI Task Execution** - Manage tasks and workflows naturally using LLMs via OpenRouter (GPT-4o, Claude 3.5, Gemini).
- 🎨 **Modern Interactive Frontend** - Built with Next.js, Tailwind CSS, Framer Motion right-to-left scroll animations, and interactive particle repulsion physics.
- 🌍 **Full Internationalization (i18n)** - Native multi-language support (English, Tiếng Việt, Español, Français, Deutsch, Português).
- 🐳 **Production-Ready Docker Architecture** - 1-command startup featuring multi-stage builds, automated Prisma database migrations, and Nginx reverse proxying on port 80.
- 📊 **Visual Management with Portainer** - Integrated Docker web GUI for monitoring CPU/RAM, viewing runtime logs, and managing containers.
- 🔒 **Self-Hosted & Privacy-First** - Full ownership of your data on your own VPS / Cloud infrastructure (e.g. Azure, AWS, DigitalOcean).

---

## 🏗️ Architecture Overview

```
taskosaur/
├── backend/                # Java 25 Spring Boot API Server (Port 3000)
│   ├── src/main/java/     # Controllers, Services, Entities, Security, DTOs
│   ├── src/main/resources/# application.yaml configuration
│   ├── pom.xml            # Maven dependencies (JPA, Security, JJWT, Lombok)
│   └── Dockerfile         # Multi-stage Docker build (Temurin 25 JDK -> JRE)
├── frontend/              # Next.js Application
│   ├── src/               # Pages router, components, contexts, hooks, i18n
│   ├── public/locales/    # Translations (en, vi, es, fr, de, pt)
│   └── Dockerfile         # Multi-stage build (Next.js export -> Nginx port 80)
├── docker/                # Deployment utilities
│   ├── nginx.conf         # Nginx reverse proxy & static asset caching
│   └── db-migrate.Dockerfile # Automated Prisma schema migration runner
├── backend/               # Legacy NestJS backend & Prisma migrations
│   └── prisma/            # Database schema and SQL migrations
└── docker-compose.spring.yml # Production Docker orchestration stack
```

---

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone the Repository
```bash
git clone https://github.com/VinhGH/Taskosaur-Spring.git taskosaur
cd taskosaur
git checkout dev
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```bash
# Database Configuration
POSTGRES_USER=taskosaur
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=taskosaur

# Web Server & Domain
APP_PORT=80
FRONTEND_URL=http://localhost
CORS_ORIGIN=http://localhost

# Security Keys
JWT_SECRET=your_super_long_and_secure_jwt_secret_key_here
JWT_ACCESS_EXPIRY_MS=900000
JWT_REFRESH_EXPIRY_MS=604800000

# OpenRouter AI (Optional for AI task execution)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### 3. Launch the Spring Boot Stack
```bash
docker compose -f docker-compose.spring.yml up -d --build
```

This single command automatically:
1. 🗄️ Initializes **PostgreSQL 16**.
2. 🔨 Runs **Prisma DB Migration** to create all tables and indexes.
3. ☕ Compiles and boots the **Java 25 Spring Boot Backend**.
4. 🌐 Builds the **Next.js Frontend** and serves it via **Nginx** on port `80`.

---

## 💻 Accessing Services

| Service | URL | Description |
| :--- | :--- | :--- |
| **Taskosaur Web App** | `http://localhost` (or your domain) | Main application UI & Landing page |
| **Spring Boot REST API** | `http://localhost/api` | Backend API endpoints |
| **Portainer Dashboard** | `http://localhost:9000` | Docker GUI container management (optional) |

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- **Java 25 LTS** and **Maven 3.9+**
- **Node.js 22+** and **npm 10+**
- **PostgreSQL 16+**

### 1. Database Setup
```bash
npm install
npm run db:migrate:deploy
```

### 2. Run Spring Boot Backend
```bash
cd backend
./mvnw clean spring-boot:run
```
*Backend runs on port `3000` (or configured `SERVER_PORT`).*

### 3. Run Next.js Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3001`.*

---

## 📡 Spring Boot REST API Overview

All endpoints are mapped under `/api/*`:

- **Authentication:** `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh-token`, `/api/auth/me`
- **Workspaces:** `/api/workspaces`, `/api/workspaces/{id}`, `/api/workspace-members`
- **Projects:** `/api/projects`, `/api/projects/{id}`, `/api/project-members`
- **Tasks & Sprints:** `/api/tasks`, `/api/tasks/{id}`, `/api/sprints`, `/api/task-statuses`, `/api/task-ranks`
- **Comments & Attachments:** `/api/tasks/{taskId}/comments`, `/api/task-attachments`, `/api/uploads`
- **AI Task Execution:** `/api/ai-chat`
- **Notifications & Activities:** `/api/notifications`, `/api/activity-logs`

---

## 🔄 CI/CD & Server Deployment Workflow

When deploying on an Ubuntu server / VPS (e.g. Microsoft Azure):

1. **Commit & push from local:**
   ```bash
   git add .
   git commit -m "feat: your new feature"
   git push origin dev
   ```

2. **Update on the server (via SSH):**
   ```bash
   cd ~/taskosaur && git pull origin dev && sudo docker compose -f docker-compose.spring.yml up -d --build
   ```

---

## 📄 License & Credits

- **Original Project:** [Taskosaur](https://github.com/Taskosaur/Taskosaur) by Taskosaur Team.
- **Modifications & Java Spring Port:** Maintained under the respective open-source licensing terms.
- **License:** Business Source License (BSL) / MIT compliance where applicable.
