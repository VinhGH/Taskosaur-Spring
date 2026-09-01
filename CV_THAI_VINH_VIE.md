# THÁI VINH
**Backend Developer (Java / Spring Boot & Node.js / NestJS)**

📍 Đà Nẵng, Việt Nam | 📞 (+84) 339464751 | ✉️ t.vinh.1109z@gmail.com  
🔗 **GitHub:** [github.com/VinhGH](https://github.com/VinhGH) | 💼 **LinkedIn:** [linkedin.com/in/yourprofile]

---

## 🎯 GIỚI THIỆU CHUNG
Backend Developer với nền tảng vững chắc về **Java & Spring Boot** và **TypeScript & NestJS**, có tư duy kiến trúc phân tầng (Controller - Service - Repository), quản trị cơ sở dữ liệu chặt chẽ và tối ưu hiệu năng với hệ thống phân tán. Có kinh nghiệm thực chiến trong việc tái cấu trúc hệ thống (Re-engineering), tối ưu hóa tốc độ truy vấn với **In-Memory Caching (Redis 7 từ ~150ms xuống < 5ms)**, thiết kế giải pháp **Distributed Rate Limiting (Spring AOP)**, quản lý **Hàng đợi bất đồng bộ (BullMQ)**, tích hợp Smart Contract Web3 và đóng gói triển khai Multi-stage Docker trên **Microsoft Azure VM**.

---

## 💡 ĐIỂM NỔI BẬT
* Làm chủ kiến trúc Backend phân tầng với cả **Java 25 (Spring Boot 3)** và **TypeScript (NestJS)**.
* Kinh nghiệm tối ưu hóa hiệu năng hệ thống: Giảm độ trễ truy vấn Dashboard từ **~150ms xuống < 5ms** bằng Redis Multi-layer Caching và tự động làm mới qua `@CacheEvict`.
* Thiết kế hệ thống bảo mật & chịu lỗi: Distributed Rate Limiting chống brute-force và cơ chế **Graceful Fallback / Fail-open** đảm bảo hệ thống duy trì hoạt động 100% khi Redis gián đoạn.
* Kinh nghiệm thực tế trong việc xử lý tác vụ bất đồng bộ On-chain với Worker Queue (**BullMQ & Redis**) và triển khai Multi-container Docker trên Azure Cloud.

---

## 🛠️ KỸ NĂNG CHUYÊN MÔN
* **Ngôn ngữ & Framework chính (Strong):** Java (17/21/25), Spring Boot (3.x), Spring Data JPA / Hibernate, Spring Security, Spring AOP, TypeScript, JavaScript, Node.js, NestJS, RESTful APIs, OOP & SOLID Principles.
* **Cơ sở dữ liệu & Cache (Working Knowledge):** PostgreSQL (Query Optimization, Indexing, Schema Migration), Redis 7 (Multi-layer Caching, Sliding Window Rate Limiting), SQL Server, Prisma ORM.
* **DevOps & Cloud (Working Knowledge):** Docker, Multi-stage Docker Compose, Nginx (Reverse Proxy), Microsoft Azure VM (Linux), Cloudflare R2 (S3 API), Git / GitHub, Postman, Maven.
* **Kiến trúc & Khái niệm Backend:** Layered Architecture, DTO Pattern, Transaction Management, Distributed Rate Limiting, Asynchronous Worker Queues (BullMQ), Resilience & Fail-open.
* **Web3 & Công nghệ hỗ trợ (Basic Exposure):** Solidity, Hardhat, Ethers.js, Next.js, Tailwind CSS.

---

## 🚀 KINH NGHIỆM DỰ ÁN

### **1. Taskosaur – Open-source Agile Project Management Platform**
*Dự án cá nhân (Backend Re-engineering, Performance Optimization & Cloud Deployment)*
* **Công nghệ:** Java 25, Spring Boot 3, PostgreSQL, Redis 7, Spring AOP, Next.js, Docker Compose, Microsoft Azure VM.
* **GitHub:** [github.com/VinhGH/Taskosaur-Spring](https://github.com/VinhGH/Taskosaur-Spring)
* **Đóng góp & Kết quả giải quyết bài toán:**
  * **Tái cấu trúc kiến trúc (Re-engineering):** Chuyển đổi toàn bộ Backend từ NestJS sang **Java 25 & Spring Boot 3**; áp dụng mô hình phân tầng nghiêm ngặt (Controller - Service - Repository) kết hợp DTO Mapping nhằm đóng gói hoàn toàn Entity và bảo vệ API contracts.
  * **Tối ưu hiệu năng với In-Memory Caching (Redis 7):** Thiết kế kiến trúc Multi-layer Cache phân tầng TTL (5 phút cho Dashboard KPIs/Charts, 15 phút cho Workspace Tree), **giảm độ trễ truy vấn thống kê từ ~150ms xuống < 5ms** và tự động đồng bộ qua `@CacheEvict` khi phát sinh thay đổi dữ liệu (Task CRUD).
  * **Distributed Rate Limiting & Security (Spring AOP):** Xây dựng Custom Annotation `@RateLimit` kết hợp Spring AOP & thuật toán Redis Sliding Window Counter để chống brute-force đăng nhập (5 req/phút) và kiểm soát chi phí gọi OpenRouter AI LLM (10 req/phút/user).
  * **Khả năng chịu lỗi (Resilience & Fail-open):** Thiết lập cơ chế Graceful Fallback, tự động chuyển sang truy vấn trực tiếp PostgreSQL khi Redis gặp sự cố, đảm bảo tính sẵn sàng 100% của hệ thống.
  * **Bảo mật & Cloud Deployment:** Cấu hình stateless JWT Authentication với HttpOnly Cookie Rotation; đóng gói hệ thống đa container (`Spring App`, `Postgres`, `Redis`, `Nginx`) bằng Docker Compose và triển khai thực tế trên **Microsoft Azure VM**.

---

### **2. Learn Proof – Online Learning & Blockchain Certificate Verification**
*Backend Developer (Core CRUD Modules, Tích hợp Web3/Smart Contract & Hàng đợi bất đồng bộ)*
* **Quy mô nhóm:** 5 thành viên | **Công nghệ:** NestJS (TypeScript), Prisma ORM, PostgreSQL, Redis (BullMQ), Solidity, Hardhat, Ethers.js, Cloudflare R2.
* **GitHub BE:** [github.com/Edward205204/BE_Learn_Proof](https://github.com/Edward205204/BE_Learn_Proof) | **GitHub BC:** [github.com/VinhGH/BC_Learn_Proof](https://github.com/VinhGH/BC_Learn_Proof)
* **Đóng góp & Kết quả giải quyết bài toán:**
  * **Thiết kế & Triển khai Smart Contract (Blockchain):** Viết và kiểm thử Smart Contract cấp chứng chỉ khóa học bất biến (Immutable Certificates) bằng **Solidity & Hardhat**; tích hợp tương tác on-chain với dịch vụ backend thông qua **Ethers.js**.
  * **Phát triển Core API & Modular Architecture:** Xây dựng hệ thống RESTful API cho quản lý khóa học, bài giảng và tài khoản người dùng theo kiến trúc Modular của NestJS, áp dụng Repository Pattern để tách biệt rõ ràng giữa tầng nghiệp vụ và truy xuất dữ liệu với **Prisma ORM & PostgreSQL**.
  * **Hàng đợi bất đồng bộ xử lý On-chain (BullMQ & Redis):** Thiết kế Worker Queue với **BullMQ & Redis** để chuyển các tác vụ minting chứng chỉ trên Blockchain ra xử lý nền, tránh việc API chính bị treo (blocking) khi chờ xác nhận khối, duy trì phản hồi API nhanh chóng (< 100ms).
  * **Lưu trữ dữ liệu khóa học:** Tích hợp **Cloudflare R2** (S3 Compatible Storage) làm dịch vụ lưu trữ dữ liệu truyền thông và tài liệu học tập, tối ưu hóa tốc độ tải và giảm chi phí hạ tầng.

---

## 🎓 HỌC VẤN
**Đại học Duy Tân (DTU)**  
*Ngành: Công nghệ phần mềm – Chương trình Chuẩn CMU*
* **Thời gian:** 2022 – 2026
* **Trạng thái:** Đã tốt nghiệp
* **Môn học tiêu biểu:** Cấu trúc dữ liệu & Giải thuật, Lập trình hướng đối tượng (OOP), Hệ quản trị CSDL, Kiến trúc phần mềm, Hệ phân tán, Hệ điều hành.

---

## 🌐 NGÔN NGỮ
* **Tiếng Việt:** Bản xứ
* **Tiếng Anh:** Giao tiếp làm việc (Có khả năng trao đổi ý kiến kỹ thuật trong team & đọc hiểu tài liệu chuyên ngành)
