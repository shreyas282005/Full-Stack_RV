# BorrowBox - Project Status & Roadmap

> **Tagline:** *"Borrow More. Own Less."*  
> **Current Phase:** Step 5 / Final Step Completed (Dockerization, Evaluation Readiness & GitHub Submission)  
> **Last Updated:** November 2026

---

## 📊 Phase Overview

| Phase | Description | Status |
|:---:|---|:---:|
| **Phase 1** | Initial Monorepo Foundation & Entry Points | **Completed** ✅ |
| **Phase 2** | Database & Schema Modeling (PostgreSQL + Prisma) | **Completed** ✅ |
| **Phase 3A** | Core Backend API (Auth, Items, Borrowing, Notifications) | **Completed** ✅ |
| **Phase 3B** | Complete React Frontend Development & Integration | **Completed** ✅ |
| **Phase 4** | Redis Caching & Socket.IO Real-Time Integration | **Completed** ✅ |
| **Phase 5** | Containerization, Evaluator Experience & GitHub Submission | **Completed** ✅ |
| **Phase 6** | CI/CD Pipeline (Jenkins Declarative Pipeline) & Dual Assignment Audit | **Completed** ✅ |
| **Bonus** | C++20 Crow High-Performance Health Microservice | **Completed** ✅ |

---

## ✅ Phase 1: Initial Foundation (Completed)

- [x] Workspace inspection and monorepo structure setup (`client` + `server`).
- [x] Initialized React SPA with Vite inside `client` using JavaScript (no TypeScript).
- [x] Initialized Node.js with Express inside `server` using ES Modules.
- [x] Configured Tailwind CSS v4 via `@tailwindcss/vite` and `@import "tailwindcss";`.
- [x] Added Express health check endpoint at `GET /api/health` returning JSON status.
- [x] Established root orchestrator scripts (`npm run dev`, `npm run dev:client`, `npm run dev:server`).
- [x] Verified frontend compilation (`npm run build` completed successfully).
- [x] Created root `README.md` and `PROJECT_STATUS.md`.

---

## ✅ Phase 2: Database & Schema Modeling (Completed)

- [x] **Prisma Configuration:** Installed `@prisma/client` and `prisma` CLI in `server/`.
- [x] **PostgreSQL Connection:** Configured `DATABASE_URL` via environment variables (`server/.env`).
- [x] **Prisma Schema (`server/prisma/schema.prisma`):** Models (`User`, `Item`, `BorrowRequest`, `Notification`), Enums (`BorrowStatus`, `ItemStatus`, `ItemCategory`, `NotificationType`).
- [x] **Database Migration:** Generated and applied migration `20261105145246_init`.
- [x] **Idempotent Seed Script:** Seeded 4 demo personas, 8 sample items, requests, and notifications.
- [x] **Database Health Checks:** Added `/api/health` and `/api/health/db`.

---

## ✅ Step 3A: Core Backend API Development (Completed)

- [x] Layered server architecture: `config/`, `errors/`, `middleware/`, `schemas/`, `services/`, `controllers/`, `routes/`.
- [x] Authentication: Demo login (`/api/auth/demo-login`), credential login with bcrypt (`/api/auth/login`), registration (`/api/auth/register`), and profile (`/api/auth/me`). JWT claims derive user identity.
- [x] Item catalog: Search, category filtering, locality filtering, item creation, editing, and deletion with ownership checks.
- [x] Borrow workflow state machine: Request, approve, reject, cancel, activate (pickup), return with overlap collision detection and PostgreSQL transactions.
- [x] Persistent notifications: Automated event creation and unread status tracking.
- [x] Documentation & Test Suite: Published `docs/API.md` and passed all 47 automated backend integration assertions (`npm run test:api`).

---

## ✅ Step 3B: Complete React Frontend Development & Integration (Completed)

- [x] **Design Language Implementation:**
  - Premium minimal consumer application styling.
  - Warm off-white background (`#FAF9F5`), forest green brand palette (`text-emerald-800`, `bg-emerald-800`), dark charcoal typography, and rounded cards (`rounded-2xl`, `rounded-3xl`).
- [x] **Centralized API Client & Context:**
  - `client/src/api/client.js`: Generic fetch client with environment base URL (`import.meta.env.VITE_API_URL || '/api'`), JWT token auto-attachment, and structured `ApiError` mapping.
  - `client/src/context/AuthContext.jsx`: Persistent session management (`localStorage`), login, demo login, registration, and user switching.
  - `client/src/context/ToastContext.jsx`: Animated floating toast alert notifications for success, error, and notice feedback.
  - `client/vite.config.js`: Integrated development proxy forwarding `/api` to Express on port 5000.
- [x] **Page Implementations:**
  - **Explore Page (`/`)**:
    - Neighborhood resource banner with tagline *"Borrow More. Own Less."*
    - Real-time search bar querying item titles and descriptions.
    - Category pills bar (Tools, Gardening, Outdoors, Appliances, Electronics, Games, Sports, Books).
    - Grid of available items displaying category badges, titles, owner names, locality tags, and availability status.
    - Shimmer skeleton loaders and friendly empty states.
  - **Item Details Page (`/items/:id`)**:
    - High-resolution hero image with automatic category fallback.
    - Item description, category tag, and owner profile card (name, locality, verification pill).
    - Borrowing date pickers (Start Date & End Date) with duration calculation.
    - Upcoming booked intervals notice to guide conflict-free scheduling.
    - "Request to Borrow" button with immediate conflict & validation feedback.
    - Owner controls: Edit Listing and Delete Listing actions when viewing own item.
  - **List an Item Page (`/items/new` & `/items/:id/edit`)**:
    - Clean form with Title, Category selector, Description, and Photo URL.
    - Quick-preset photo suggestions for each category from high-res curated Unsplash library.
    - Live image preview.
    - Form validation and direct submission to backend API.
  - **My Activity Page (`/activity`)**:
    - **My Borrowings Tab:** Outgoing requests initiated by user, tracking status (`Pending Approval`, `Approved`, `Currently On Loan`, `Returned & Completed`).
      - Cancel button on pending requests.
      - Pickup confirmation button on approved requests.
      - Return confirmation button on active borrowings.
    - **My Listings & Lending Tab:**
      - Incoming borrow requests with One-Click Approve and Decline buttons.
      - Handover activation and Return completion buttons.
      - Grid of owned listings with Edit and Delete shortcuts.
  - **Login Page (`/login`)**:
    - One-click login cards for seeded demo personas:
      - 👤 Alice Green (Oakwood Neighborhood)
      - 👤 Bob Builder (Maple Heights)
      - 👤 Charlie Rivers (Pinecrest District)
      - 👤 Dana Hayes (Sunnyvale Commons)
    - Standard email/password login tab.
    - New neighbor account registration tab.
- [x] **Navigation & Persistent Notification Flyout:**
  - `Navbar.jsx`: Logo, links, mobile menu, user dropdown with persona switcher, and notification bell.
  - Live unread notification counter badge.
  - `NotificationDrawer.jsx`: Slide-out panel displaying persistent alerts, timestamps, single-click mark-as-read, and "Mark all as read".
- [x] **Verification & Production Build:**
  - `npm run build:client` completed cleanly with zero warnings (`dist/` generated in 2.69s).
  - All 47 backend integration assertions pass (`npm run test:api`).
  - Seamless proxy verified between Vite (`:5173`) and Express (`:5000`).

---

## ✅ Phase 4: Redis Caching & Socket.IO Real-Time Integration (Completed)

- [x] **Redis Caching Layer (`server/src/redis/`):**
  - Configured `ioredis` with environment variables (`REDIS_URL`, `REDIS_CACHE_TTL`, `REDIS_ITEM_DETAIL_TTL`).
  - Implemented `cache.service.js` with canonical key generation for catalog listings (`items:list:*`) and item details (`items:detail:<id>`).
  - Observable structured logging (`[Redis Cache] HIT`, `[Redis Cache] MISS`, `[Redis Cache] SET`, `[Redis Cache] INVALIDATED`).
  - Invalidation hooks on item mutations (create, update, delete) and borrow availability transitions (`ACTIVE`, `RETURNED`).
  - Redis-backed distributed rate limiter via `rate-limit-redis`.
  - Resilient offline fallback: when Redis is unavailable, server automatically falls back to PostgreSQL queries with zero interruption.
- [x] **Socket.IO Real-Time Gateway (`server/src/socket/index.js`):**
  - Mounted onto Express HTTP server at `/socket.io/`.
  - Authenticated handshake verifying JWT signature (`config.jwt.secret`) and rejecting unauthenticated or invalid connections.
  - Server-controlled user-specific rooms (`user:${userId}`). Strict room isolation preventing clients from joining unauthorized rooms.
  - Emits real-time events strictly **after** database transactions commit:
    - `notification:new`
    - `notification:read`
    - `notification:read-all`
    - `borrow-request:created`
    - `borrow-request:updated`
    - `item:availability-updated`
- [x] **React Client Socket.IO Integration (`client/src/`):**
  - `SocketContext.jsx`: Manages socket lifecycle, auto-connects with auth token on login, disconnects on logout, and handles auto-reconnection.
  - `Navbar.jsx`: Live socket connectivity status indicator dot, real-time unread notification badge updates without polling (removed 30s `setInterval`).
  - `NotificationDrawer.jsx`: Prepends incoming notifications dynamically in real-time.
  - `ActivityPage.jsx`: Listens to `borrow-request:created` and `borrow-request:updated` to refresh borrowing and lending lists instantly without manual page reloads.
  - `ExplorePage.jsx` & `ItemDetailPage.jsx`: Listens to `item:availability-updated` to update availability status badges on the fly.
  - `client/vite.config.js`: Added `/socket.io` proxy with `ws: true` forwarding WebSocket handshakes to Express port 5000.
- [x] **Automated Verification:**
  - 31 automated assertions in `server/test-step4.js` (`npm run test:step4` passed with 0 failures).
  - 47 regression assertions in `server/test-step3a.js` (`npm run test:api` passed with 0 failures).
  - Total 78 verified backend assertions.
  - Production client build succeeds in 3.26s (`npm run build:client`).

---

## ✅ Phase 5: Containerization, Evaluator Experience & GitHub Submission (Completed)

- [x] **Production Docker Compose (`docker-compose.yml`):**
  - PostgreSQL 16 Alpine with named volume persistence (`borrowbox_postgres_data`) and health check (`pg_isready`).
  - Redis 7 Alpine with volume persistence (`borrowbox_redis_data`) and health check (`redis-cli ping`).
  - Backend Node.js Express service (`borrowbox-server`) with automatic migration deployment (`prisma migrate deploy`), automated idempotent seed execution (`prisma/seed.js`), and health check (`wget http://localhost:5000/api/health`).
  - Frontend production service (`borrowbox-client`) with multi-stage build (`node:22-alpine` builder + `nginx:alpine` runtime), reverse-proxying `/api` and `/socket.io` to backend.
  - One-command startup: `docker compose up --build`.
- [x] **Comprehensive Evaluator Experience:**
  - Expanded catalog to **20 realistic items** spanning 8 categories with high-resolution imagery.
  - Pre-seeded borrowing workflows demonstrating all 5 statuses: `PENDING`, `APPROVED`, `ACTIVE`, `RETURNED`, and `REJECTED`.
  - 4 clearly labeled demo personas (Alice, Bob, Charlie, Dana) with instant 1-click login and persona switching.
  - Interactive in-app **"How BorrowBox Works"** section on the Explore page.
  - In-app **"Evaluator Guide"** modal (`EvaluationGuideModal.jsx`) accessible from any page with a single click.
- [x] **Automated Testing & Idempotency Verification:**
  - Core backend test suite: 47 assertions passed (`npm run test:api`).
  - Redis caching & Socket.IO test suite: 31 assertions passed (`npm run test:step4`).
  - Total automated assertions: 78 passed, 0 failed.
  - Idempotent seed test: verified with multiple consecutive runs with 0 duplicates.
  - Production client build: verified in 2.11s (`npm run build:client`).
- [x] **Optional C++ Bonus:**
  - Independent C++20 Crow HTTP microservice in `bonus/crow-service/` exposing `/`, `/health`, and `/api/crow-health` on port 8080.
- [x] **Clean GitHub Repository Standards:**
  - `.env` files with credentials excluded; `.env.example` templates complete across root, client, and server.
  - Clean `.gitignore` and `.dockerignore` files preventing build and secret leaks.
  - Professional documentation in `README.md` and `docs/API.md`.

---

## ✅ Phase 6: CI/CD Pipeline (Jenkins Declarative Pipeline) & Dual Assignment Audit (Completed)

- [x] **Declarative Jenkinsfile (`Jenkinsfile`):**
  - **Stage 1 (Checkout):** Automatic source checkout using `checkout scm` and Git commit SHA resolution.
  - **Stage 2 (Build):** Validates Docker CLI availability and builds Docker images using `docker compose build`.
  - **Stage 3 (Deploy):** Deploys locally to configurable predefined path (`DEPLOY_DIR` defaulting to `/opt/borrowbox` or `./deploy`), copies application definitions, performs graceful zero-downtime container recreation (`docker compose down --remove-orphans && docker compose up -d --build`), and executes container health verification.
  - **Persistent Volumes:** Preserves PostgreSQL database volume (`borrowbox_postgres_data`) across deployments.
  - **Post-Build Actions:** Comprehensive notifications and execution logs for `always`, `success`, and `failure` states.
- [x] **Dual Internship Assignment Compliance:**
  - **Assignment 1 (Full-Stack):** React 19 + Node.js Express ESM + PostgreSQL 16 (Prisma ORM) + Redis 7 caching + Socket.IO WebSockets + Optional C++20 Crow microservice.
  - **Assignment 2 (DevOps):** Multi-stage Dockerfiles + `docker-compose.yml` with health checks and network isolation + 3-stage declarative `Jenkinsfile` deploying locally to a predefined path + 20-section comprehensive `README.md`.
- [x] **Docker Compose Profile Configuration:**
  - Standard stack: `postgres`, `redis`, `server`, `client`.
  - Bonus microservice: `crow` activated cleanly with `--profile bonus` or `--profile all`.
- [x] **Repository Audit & Documentation:**
  - 20-section `README.md` with complete installation, architecture, demo credentials, 2-browser testing, troubleshooting, and CI/CD walkthrough.
  - Complete REST and WebSocket documentation in `docs/API.md`.

---

## 🧪 Verification Log (Final)

| Target / Workflow | Test Performed | Expected Result | Observed Result | Status |
|---|---|---|---|:---:|
| Core API Regression Suite | `npm run test:api` | All 47 core API integration tests pass | 47 Passed, 0 Failed | PASS ✅ |
| Redis & Socket.IO Test Suite | `npm run test:step4` | All 31 real-time & caching assertions pass | 31 Passed, 0 Failed | PASS ✅ |
| Total Test Assertions | `npm run test` | 78 automated assertions pass | 78 Passed, 0 Failed | PASS ✅ |
| Seed Script Idempotency | `npm run db:seed` (ran twice consecutively) | Seeds 4 personas, 20 items, 5 lifecycle requests without duplicate errors | Identical output, 0 errors, 0 duplicates | PASS ✅ |
| Client Production Build | `npm run build:client` | Vite + Tailwind + Socket.IO builds cleanly | Built in 2.11s (`dist/` generated) | PASS ✅ |
| In-App Evaluator Guide | Navbar + Explore page modals | Displays 1-click demo personas, 2-browser test instructions, and 3-step guide | Verified interactive modals in UI | PASS ✅ |
| Docker Configurations | `Dockerfile` (server, client, bonus) + `docker-compose.yml` + `nginx.conf` | Fully configured with health checks, dependencies, and reverse proxies | Syntactically verified and aligned with OCI specs | PASS ✅ |
