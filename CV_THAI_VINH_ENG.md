# THAI VINH
**Backend Developer (Java / Spring Boot & Node.js / NestJS)**

📍 Da Nang, Vietnam | 📞 (+84) 339464751 | ✉️ t.vinh.1109z@gmail.com  
🔗 **GitHub:** [github.com/VinhGH](https://github.com/VinhGH) | 💼 **LinkedIn:** [linkedin.com/in/yourprofile]

---

## 🎯 PROFESSIONAL SUMMARY
Disciplined and impact-driven Backend Engineer with solid expertise in **Java & Spring Boot** and **TypeScript & NestJS** ecosystems. Deep understanding of **Layered Architecture (Controller-Service-Repository), Database Modeling, and Distributed In-Memory Caching**. Proven track record in re-architecting complex backends, slashing API latency with **Redis 7 (from ~150ms to < 5ms)**, developing custom **Spring AOP Rate Limiters**, managing **Asynchronous Worker Queues (BullMQ)**, and containerizing production services via **Docker Compose on Microsoft Azure VM**. Passionate about clean code, fault-tolerant resilience, and understanding the architectural trade-offs behind technical decisions.

---

## 🛠️ TECHNICAL SKILLS
* **Languages & Core Frameworks (Strong):** Java (17/21/25), Spring Boot (3.x), Spring Data JPA / Hibernate, Spring Security, Spring AOP, TypeScript, JavaScript, Node.js, NestJS, RESTful APIs, OOP & SOLID Principles.
* **Databases & In-Memory Storage (Working Knowledge):** PostgreSQL (Query Optimization, Indexing, Schema Design), Redis 7 (Multi-layer Caching, Sliding Window Rate Limiting), SQL Server, Prisma ORM.
* **DevOps & Cloud (Working Knowledge):** Docker, Multi-stage Docker Compose, Nginx (Reverse Proxy), Microsoft Azure VM (Linux), Cloudflare R2 (S3 Compatible), Git / GitHub, Postman, Maven.
* **Architecture & Backend Concepts:** Layered / Clean Architecture, DTO Pattern, Transaction Management, Distributed Rate Limiting, Asynchronous Worker Queues, Fault Tolerance & Fail-open Resilience.
* **Web3 & Supporting Technologies (Familiar / Basic Exposure):** Solidity, Hardhat, Ethers.js, Next.js, Tailwind CSS.

---

## 🚀 FEATURED PROJECTS

### **1. Taskosaur – Agile Project Management & AI Execution Platform**
*Backend Re-engineering, Performance Optimization & Cloud Deployment (Personal Project)*
* **Tech Stack:** Java 25, Spring Boot 3, PostgreSQL, Redis 7, Spring AOP, Next.js, Docker Compose, Microsoft Azure VM.
* **GitHub:** [github.com/VinhGH/Taskosaur-Spring](https://github.com/VinhGH/Taskosaur-Spring)
* **Key Achievements & Technical Decisions:**
  * **Architectural Re-engineering:** Led the full backend migration from NestJS to modern **Java 25 & Spring Boot 3**; enforced a strict 3-tier architecture (Controller - Service - Repository) and DTO abstraction layer, eliminating direct domain entity exposure to API clients.
  * **High-Performance In-Memory Caching (Redis 7):** Designed a multi-layer caching strategy with custom TTL segmentation (5 min for Dashboard KPIs/Charts, 15 min for Workspace Tree), **slashing aggregation query latency from ~150ms to < 5ms** with event-driven `@CacheEvict` on task mutations.
  * **Distributed Rate Limiting & Security (Spring AOP):** Engineered custom `@RateLimit` annotation powered by Spring AOP and Redis Sliding Window Counter to mitigate brute-force authentication (5 req/min) and regulate OpenRouter AI LLM consumption (10 req/min/user).
  * **Resilience & Fault Tolerance:** Configured a **Graceful Fallback & Fail-open** mechanism that automatically queries PostgreSQL when Redis experiences downtime, ensuring 100% continuous system availability.
  * **Security & Cloud Deployment:** Implemented stateless JWT authentication with HttpOnly cookie rotation; packaged multi-container services (`Spring App`, `Postgres`, `Redis`, `Nginx`) using Docker Compose and deployed live on a **Microsoft Azure VM**.

---

### **2. Learn Proof – Online Learning & Blockchain Certificate Verification**
*Backend Developer (Core CRUD Modules, Web3/Smart Contract Integration & Async Queues)*
* **Team Size:** 5 members | **Tech Stack:** NestJS (TypeScript), Prisma ORM, PostgreSQL, Redis (BullMQ), Solidity, Hardhat, Ethers.js, Cloudflare R2.
* **GitHub BE:** [github.com/Edward205204/BE_Learn_Proof](https://github.com/Edward205204/BE_Learn_Proof) | **GitHub BC:** [github.com/VinhGH/BC_Learn_Proof](https://github.com/VinhGH/BC_Learn_Proof)
* **Key Achievements & Technical Decisions:**
  * **Smart Contract & Web3 Integration:** Developed, tested, and deployed certificate-issuance Smart Contracts using **Solidity & Hardhat**; integrated on-chain interactions with backend NestJS services via **Ethers.js**.
  * **Core CRUD APIs & Modular Architecture:** Designed and implemented RESTful API modules for course catalog, curriculum management, and user profiles adhering to NestJS Modular Architecture and Repository Pattern with **Prisma ORM & PostgreSQL**.
  * **Asynchronous On-Chain Workers (BullMQ & Redis):** Architected background worker queues using **BullMQ & Redis** to offload blockchain minting tasks from the primary request-response lifecycle, preventing API blocking during block confirmations and maintaining sub-100ms response times.
  * **Cloud Asset Management:** Integrated **Cloudflare R2** (S3 Compatible Storage) for secure, low-latency distribution of course media assets and documents.

---

## 🎓 EDUCATION
**Duy Tan University (DTU)**  
*Bachelor of Science in Software Engineering – CMU Standard Program*
* **Timeline:** 2022 – 2026
* **Status:** Graduated / Senior
* **Relevant Coursework:** Data Structures & Algorithms, Object-Oriented Programming, Database Management Systems, Software Architecture, Distributed Systems, Operating Systems.

---

## 🌐 LANGUAGES
* **Vietnamese:** Native
* **English:** Working Proficiency (Able to communicate technical ideas clearly in team discussions & read technical documentation)
