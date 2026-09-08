# Taskosaur (Enterprise Java Spring Boot Edition)

<div align="center">
  <img src="https://raw.githubusercontent.com/Taskosaur/Taskosaur/main/frontend/public/taskosaur-logo.svg" alt="Taskosaur Logo" width="128">
  <h2>Taskosaur - Open Source Project Management Platform</h2>
  <p><b>Enterprise-grade Project Management powered by Autonomous Conversational AI & Real-Time Collaboration</b></p>
  <p><i>Re-architected with a high-performance Java 25 Spring Boot backend, Next.js 16 frontend, PostgreSQL 16, Redis 7, and WebSocket STOMP</i></p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/VinhGH/Taskosaur-Spring/actions/workflows/ci.yml"><img src="https://img.shields.io/badge/CI%2FCD-Passing-brightgreen?style=flat-square&logo=githubactions" alt="CI/CD Status"></a>
    <img src="https://img.shields.io/badge/Java-25%20LTS-ED8B00?style=flat-square&logo=openjdk&logoColor=white" alt="Java 25">
    <img src="https://img.shields.io/badge/Spring%20Boot-4.x%20%2F%203.x-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot">
    <img src="https://img.shields.io/badge/Next.js-16.1.1-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
    <img src="https://img.shields.io/badge/Redis-7%20Alpine-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
    <img src="https://img.shields.io/badge/i18n-6%20Languages-FFD700?style=flat-square" alt="i18n">
    <img src="https://img.shields.io/badge/License-BSL%201.1%20%2F%20MPL-lightgrey?style=flat-square" alt="License">
  </p>

  <p>
    <a href="http://taskosaur.malaysiawest.cloudapp.azure.com"><b>🌐 Live Production Demo</b></a> •
    <a href="#-key-features"><b>Key Features</b></a> •
    <a href="#-architecture--monorepo-structure"><b>Architecture</b></a> •
    <a href="#-quick-start-with-docker"><b>Quick Start</b></a> •
    <a href="#-cicd-pipeline-github-actions"><b>CI/CD Pipeline</b></a> •
    <a href="#-attribution-heritage--credits"><b>Attribution & Credits</b></a>
  </p>
</div>

---

> [!IMPORTANT]
> ### 📜 Attribution, Heritage & Copyright Notice
> **Taskosaur (Java Spring Boot Edition)** is an enterprise adaptation based on the original open-source project [**Taskosaur/Taskosaur**](https://github.com/Taskosaur/Taskosaur), originally created and copyrighted by **NetTantra Technologies (India) Private Limited** and the **Taskosaur Open Source Team**.
>
> All credit, trademarks, intellectual property, and original UI/UX conceptual design belong to **NetTantra Technologies** and the **Taskosaur Team**.
>
> **What this edition contributes:**
> - Complete re-architecture of the backend from legacy Node.js/NestJS to an enterprise-grade **Java 25 Spring Boot** stack with Spring Data JPA, Hibernate, HikariCP, and Spring Security JJWT.
> - Implementation of a real-time **Spring WebSocket STOMP** bus (`/ws`, `/topic`) powering live member online presence and typing indicators.
> - An intelligent **Event-Driven Workflow Automation Engine (IFTTT)** with automated QA assignment and full-screen emergency alert modals.
> - An upgraded **Conversational AI Task Execution Engine** with multi-step reasoning visualization, natural language project date setup, automatic member resolution, and message rollback/copy micro-interactions.
> - Modernized, cross-platform **GitHub Actions Monorepo CI/CD pipelines** with PostgreSQL 16 & Redis 7 integration testing and automated container publishing to GHCR.

---

## 🌐 Live Production Deployment

The platform is deployed and running on **Microsoft Azure Cloud** (Ubuntu 24.04 LTS):

| Service | Endpoint | Description |
| :--- | :--- | :--- |
| **Production Web Platform** | [http://taskosaur.malaysiawest.cloudapp.azure.com](http://taskosaur.malaysiawest.cloudapp.azure.com) | Main Application, Kanban Boards & AI Chat |
| **Spring Boot REST API** | [http://taskosaur.malaysiawest.cloudapp.azure.com/api](http://taskosaur.malaysiawest.cloudapp.azure.com/api) | High-performance Java 25 backend endpoints |
| **Portainer Cloud Dashboard** | [http://taskosaur.malaysiawest.cloudapp.azure.com:9000](http://taskosaur.malaysiawest.cloudapp.azure.com:9000) | Visual Docker container & resource monitoring |

---

## ✨ Key Features & Capabilities

### 🤖 1. Autonomous Conversational AI Task Execution
- **Natural Language Task Management**: Directly create, update priority, change status, assign members, and query tasks by chatting naturally with the AI Assistant.
- **Visual Multi-Step Reasoning (Deep Thinking)**: Displays real-time analytical problem-solving progression (`Quá trình giải quyết`) with expandable step-by-step audit logs instead of a static loading spinner.
- **Smart Date & Member Resolution**: Intelligently parses pronouns (*"assign this task to me"*, *"reporter is user with email..."*), flexible date formats (`dd/MM/yyyy`, `yyyy-MM-dd`), and sets project timelines.
- **Micro-Interaction Action Bar**: Every chat message supports **1-Click Copy** to clipboard and **Message Rollback** (truncating history, repopulating the prompt into textarea, and synchronizing with localStorage & server).

### ⚡ 2. Real-Time Collaboration (Spring WebSocket STOMP)
- **Live Event Broadcasting**: Instant board updates across all connected clients via `/topic/projects/{projectId}/tasks` and `/topic/user/{userId}` without browser reload.
- **Online Presence & Typing Indicators**: Real-time member presence badges (🟢 Online / ⚪ Offline) and live *"✍️ [User] is typing a comment..."* indicators.
- **Cascading Invitations**: Seamless member onboarding across Organizations, Workspaces, and Projects.

### ⚙️ 3. Workflow Automation Rules (IF-THIS-THEN-THAT Engine)
- **Event-Driven Rules Engine**: Configure automated triggers (`TASK_STATUS_CHANGED`, `TASK_PRIORITY_CHANGED`, `TASK_ASSIGNED`) paired with automated actions (`ASSIGN_TASK`, `CHANGE_STATUS`, `SEND_NOTIFICATION`, `ADD_COMMENT`).
- **Emergency Priority Alert Modal**: When a task is escalated to `HIGHEST`, the system triggers an emergency protocol: synthesized Web Audio chime, real-time STOMP push, async SMTP email, and a full-screen alert modal (`bg-black/80 backdrop-blur-md`).
- **Audit Execution History**: Detailed millisecond-precision execution logs tracking rule success/failure metrics.

### 🔗 4. Secure Public Task Sharing
- **Tokenized Guest Access**: Generate secure, tamper-proof sharing tokens allowing external stakeholders and clients to view task progress at `/public/task/[token]` without requiring an account.
- **Granular Security Controls**: Configurable token expiration (1, 3, 7, 14, 30 days) and instant token revocation.

### ⏱️ 5. Worklog Timer & Time Tracking
- **Interactive Stopwatch**: 1-click Start/Stop worklog timer with real-time second counters.
- **Manual Logging & Reporting**: Log time spent, categorize activities, view aggregated team hours, and export audit reports to CSV/Excel.

### 🌍 6. Full Internationalization (i18n)
- Native multi-language support across **6 languages**: English (`en`), Tiếng Việt (`vi`), Español (`es`), Français (`fr`), Deutsch (`de`), and Português (`pt`).

---

## 🏗️ Architecture & Monorepo Structure

The project is structured as a clean, standardized monorepo:

```
taskosaur/
├── backend/                         # Java 25 Spring Boot API Server (Port 3000)
│   ├── src/main/java/com/taskosaur/
│   │   ├── controllers/            # REST API endpoints (Auth, Projects, Tasks, AI)
│   │   ├── services/               # Business logic, STOMP broadcasts, AI tool execution
│   │   ├── models/                 # JPA / Hibernate entities (Project, Task, Member)
│   │   ├── repositories/           # Spring Data JPA repositories
│   │   ├── config/                 # SecurityConfig (JJWT), WebSocketConfig (STOMP)
│   │   └── seeder/                 # Automated database initialization
│   ├── src/main/resources/
│   │   └── application.yaml        # Configuration (PostgreSQL, Redis, Mail, OpenRouter)
│   ├── pom.xml                     # Maven dependencies (Java 25, Spring Boot 4.x)
│   └── Dockerfile                  # Multi-stage build (Temurin 25 JDK -> minimal JRE)
│
├── frontend/                        # Next.js 16 Application (Turbopack + Tailwind CSS)
│   ├── src/
│   │   ├── pages/                  # Next.js Pages router (Kanban, Settings, Automations)
│   │   ├── components/             # React components (ChatPanel, KanbanBoard, Modals)
│   │   ├── contexts/               # NotificationContext (WebSocket STOMP), AuthContext
│   │   └── utils/                  # API clients, dayjs formatters, sound synthesizers
│   ├── public/locales/             # i18n translation dictionaries (en, vi, es, fr, de, pt)
│   └── Dockerfile                  # Multi-stage build (Next.js static export -> Nginx port 80)
│
├── database/                        # Database Management
│   ├── prisma/
│   │   ├── schema.prisma           # Source-of-truth PostgreSQL schema definition
│   │   └── migrations/             # Timestamped SQL database migrations
│   └── package.json                # Lightweight @taskosaur/database workspace
│
├── docker/                          # Containerization Configurations
│   ├── nginx.conf                  # Nginx reverse proxy routing `/api` -> Backend:3000
│   └── db-migrate.Dockerfile       # Automated migration container
│
├── scripts/                         # Monorepo Utilities
│   └── mvnw.js                     # Cross-platform Maven runner (Windows .cmd / Linux ./mvnw)
│
├── .github/workflows/               # Modernized GitHub Actions CI/CD
│   ├── ci.yml                      # Monorepo CI: Path filter, PostgreSQL, Redis, JDK 25
│   ├── docker-publish.yml          # Container publishing to GitHub Container Registry
│   └── security.yml                # NPM dependency vulnerability scanning
│
├── docker-compose.prod.yml          # Production deployment orchestration stack
└── package.json                     # Root monorepo workspace configuration
```

---

## 🚀 Quick Start with Docker (Recommended)

### 1. Clone & Checkout
```bash
git clone https://github.com/VinhGH/Taskosaur-Spring.git taskosaur
cd taskosaur
git checkout dev
```

### 2. Configure Environment Variables

Tất cả biến môi trường cho toàn bộ stack (Frontend + Backend + DB) đều nằm trong **một file duy nhất** ở root:

```bash
cp .env.example .env
```

Các biến quan trọng cần thay đổi:

```env
# Bắt buộc - Security (tạo bằng: openssl rand -base64 32)
JWT_SECRET=CHANGE_ME_run_openssl_rand_-base64_32
JWT_REFRESH_SECRET=CHANGE_ME_run_openssl_rand_-base64_32
ENCRYPTION_KEY=CHANGE_ME_run_openssl_rand_-hex_32

# Bắt buộc - Database
POSTGRES_PASSWORD=taskosaur
DATABASE_URL=postgresql://taskosaur:taskosaur@localhost:5432/taskosaur

# Optional - AI (dang ky tai https://openrouter.ai)
OPENROUTER_API_KEY=sk-or-your-key-here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

> **Luu y:** File `.env` da co trong `.gitignore` — khong bao gio commit file `.env` that len Git.

### 3. Launch the Stack
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

The system automatically initializes in sequence:
1. 🗄️ Boots **PostgreSQL 16** with UTC timezone.
2. 🔨 Boots **Redis 7** for caching and rate limiting.
3. 📦 Runs **Database Migrations** applying Prisma SQL migrations.
4. ☕ Starts the **Java 25 Spring Boot Backend** on port `3000`.
5. 🌐 Launches the **Next.js Frontend** served through **Nginx** on port `80`.

Open your browser at **`http://localhost`** to access Taskosaur!

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- **Java 25 LTS** (Eclipse Temurin or Oracle JDK 25)
- **Node.js 22+** and **npm 10+**
- **PostgreSQL 16+** and **Redis 7+**

### 1. Install Monorepo Dependencies & Setup Database
```bash
npm install
npm run db:generate
npm run db:migrate:deploy
```

### 2. Run Backend (Spring Boot 25)
```bash
# Cross-platform command (works on Windows, Linux, and macOS)
npm run dev:backend
```
*Backend runs on `http://localhost:3000/api`.*

### 3. Run Frontend (Next.js 16)
In a separate terminal:
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:3001`.*

---

## 🔄 CI/CD Pipeline (GitHub Actions)

Taskosaur features an automated enterprise CI/CD pipeline in `.github/workflows/`:

```mermaid
flowchart TD
    A["Git Push / Pull Request"] --> B{"Detect Changes (Path Filter)"}
    B -->|Database changed| C["Database Schema Check (Prisma)"]
    B -->|Frontend changed| D["Frontend Lint (ESLint) & Build (Turbopack)"]
    B -->|Backend changed| E["Backend CI (JDK 25 + Postgres 16 & Redis 7)"]
    B -->|Docker changed| F["Docker Compose & Container Verification"]
    C --> G["CI Gatekeeper Status Check"]
    D --> G
    E --> G
    F --> G
    G -->|All Passed| H["✅ Green Build (Merge Ready)"]
```

1. **`ci.yml`**: Smart path filtering with `dorny/paths-filter@v3`. Spins up real PostgreSQL 16 and Redis 7 service containers, executes Prisma migrations, compiles with JDK 25, runs JUnit 5 tests, and builds Next.js production bundles with Turbopack caching.
2. **`docker-publish.yml`**: Automatically builds production multi-stage Docker images (`linux/amd64`) and pushes to GitHub Container Registry (`ghcr.io/vinhgh/backend`, `frontend`, `db-migrate`).
3. **`security.yml`**: Automates security vulnerability auditing on all production npm dependencies.

---

## 📡 REST API & STOMP Endpoints

### REST Endpoints (`/api/*`)
| Group | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register`, `/api/auth/login` | User authentication & JWT issuance |
| **Workspaces** | `GET / POST` | `/api/workspaces`, `/api/workspaces/{id}` | Workspace tenant isolation management |
| **Projects** | `GET / POST` | `/api/projects`, `/api/projects/{id}` | Project configuration & timeline setup |
| **Tasks** | `GET / POST` | `/api/tasks`, `/api/tasks/{id}` | Full task lifecycle management |
| **Automations**| `GET / POST` | `/api/automation-rules` | IF-THEN workflow rules & executions |
| **AI Chat** | `POST` | `/api/ai-chat/chat`, `/api/ai-chat/history` | Autonomous tool calling execution |
| **Sharing** | `POST / GET` | `/api/task-shares`, `/api/public/task/{token}`| Secure guest task viewing |
| **Worklogs** | `GET / POST` | `/api/worklogs`, `/api/worklogs/export` | Time tracking and CSV export |

### WebSocket STOMP Endpoints
- **Connection Broker**: `/ws` (with SockJS fallback).
- **Project Topic**: `/topic/projects/{projectId}/tasks` (Task creation, status movement, assignee changes).
- **User Alerts**: `/topic/user/{userId}` (Personal notifications, emergency priority alerts).
- **Presence & Typing**: `/topic/projects/{projectId}/presence`, `/topic/tasks/{taskId}/typing`.

---

## 📄 Attribution, Heritage & Credits

This project proudly builds upon the foundation created by the open-source community:

- **Original Project & Concept:** [Taskosaur](https://github.com/Taskosaur/Taskosaur)
- **Original Authors & Copyright:** [NetTantra Technologies (India) Private Limited](https://www.nettantra.com) and the **Taskosaur Team**.
- **Java Spring Boot Port & Enterprise Extensions:** Maintained by [Vinh Thái (VinhGH)](https://github.com/VinhGH).
- **License:** Governed under the terms of the **Business Source License 1.1 (BSL)** converting to **Mozilla Public License 2.0 (MPL 2.0)**. See [LICENSE.md](LICENSE.md) for complete details.

<div align="center">
  <sub>Built with passion for open-source software engineering and modern distributed architectures.</sub>
</div>
