# 🚀 Taskosaur Development Roadmap (Java Spring Edition)

---

> [!NOTE]
> ### 📜 Attribution Notice
> Based on the original feature roadmap of [Taskosaur/Taskosaur](https://github.com/Taskosaur/Taskosaur), expanded with Java 25 Spring Boot backend architecture and production cloud infrastructure.

---

## ✅ Recently Completed Features
- ☕ **Java 25 Spring Boot Backend Port** - Complete REST API implementation with Spring Data JPA, Hibernate, and JJWT security
- 🐳 **Production Docker Compose Stack** - Orchestration for Java Spring Boot + Next.js Nginx reverse proxy + PostgreSQL 16 + Portainer GUI
- 🌍 **Full Internationalization (i18n)** - 6 languages supported (English, Tiếng Việt, Español, Français, Deutsch, Português)
- 🎨 **Landing Page UI/UX Enhancements** - Framer Motion smooth scroll animations and HTML5 Canvas particle repulsion physics
- 📊 **Interactive Gantt Chart & Calendar View** - Drag-and-drop task rescheduling and timeline visualization
- 📈 **KPI Metrics & Analytics Dashboard** - Real-time project charts and performance tracking
- 📑 **Data Export** - Paginated task lists exportable to CSV and Excel

---

### 🔒 Security & Authentication
- [x] Add support for OpenID Connect (OIDC) login.
- [x] Java JJWT Stateless Authentication with Refresh Token rotation.
- [ ] Add SAML login.
- [ ] Enable login via Google, GitHub, and Azure with auto-account creation.
- [ ] Implement 2FA (TOTP) and SMS login with recovery codes.
- [x] Build an admin dashboard to manage system config.
- [ ] Add user session management to the admin dashboard.

---

### 📊 Analytics & Reporting
- [ ] Create workload heatmaps and a project completion predictor.
- [x] Design a drag-and-drop system for custom dashboard widgets.
- [ ] Create a visual report builder with scheduled email delivery.
- [x] Support exporting reports to Excel and CSV.

---

### 🔄 Import/Export & Migration
- [x] Build importers for Jira and Trello with field mapping.
- [ ] Build an Asana importer.
- [x] Create a CSV/Excel bulk importer.
- [ ] Enable full project exports including all files and settings.

---

### 🤖 AI Enhancement
- [x] OpenRouter LLM integration (GPT-4o, Claude 3.5, Gemini).
- [ ] Make the AI remember conversation history across sessions.
- [ ] Let AI break down big tasks (Epics) into smaller subtasks.
- [ ] Add AI forecasting for team capacity and sprint success.

---

### 💬 Enhanced Team Collaboration
- [ ] Add online status indicators, live comment system, and DND feature.

---

**Document Version:** 2.0 (Spring Edition)  
**Last Updated:** August 30, 2026  
**Maintained By:** Taskosaur Development Team