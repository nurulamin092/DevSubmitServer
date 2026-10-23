# DevSubmit — Project Submission & Review API

Backend for a project submission and mentor review dashboard.
Built as a standalone API so the Next.js frontend can consume it independently.

**Stack:** Express 5 · TypeScript (ESM) · Prisma 7 · PostgreSQL (Neon) · JWT RBAC

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [Response shape](#response-shape)
- [Seed credentials](#seed-credentials)
- [Rate limits](#rate-limits)
- [Security](#security)
- [Project structure](#project-structure)
- [Known limitations](#known-limitations)
- [Production deployment](#production-deployment)
- [Testing](#testing)

---

## Features

### Student portal

- Single submission per student (DB-enforced via `studentId @unique`)
- Repository URL uniqueness across the whole system (case-insensitive, trailing-slash normalized)
- GitHub / GitLab / Bitbucket URL validation
- Description length validation (30–3000 chars)
- Submission rate limiting (5/hour in prod)
- View own submission with mentor decision + rejection reason

### Mentor dashboard

- Paginated project list (`page`, `limit`, max 100/page)
- Server-side filters: `status`, `search` (case-insensitive across project name, description, student name)
- Sorting: `createdAt` / `reviewedAt`, `asc` / `desc`
- Approve / reject actions with race-safe atomic writes
- Rejection reason mandatory on `REJECTED`
- Aggregate stats: pending / approved / rejected / total

### Auth & RBAC

- JWT (HS256 algorithm pinned on both sign and verify)
- Roles: `STUDENT`, `MENTOR`, `ADMIN`
- `ADMIN` bypasses all `requireRole` gates
- bcrypt password hashing (12 rounds default)
- Timing-safe login (bcrypt compare runs even when user not found)

### Security

- `helmet` HTTP headers
- CORS allowlist (no wildcard)
- IPv6-safe rate limiting (`ipKeyGenerator` helper)
- Mass-assignment protection (`status`, `studentId` from body ignored)
- JSON escape (`<`, `>`, `&` in response strings)
- Central error handler — no stack traces in production
- `express.json` body size cap (100 KB)

---

## Tech stack

| Layer           | Choice                                                      |
| --------------- | ----------------------------------------------------------- |
| Language        | TypeScript (ESM, `"type": "module"`)                        |
| Runtime         | Node.js ≥ 20                                                |
| Framework       | Express 5                                                   |
| ORM             | Prisma 7 (`prisma-client` generator + `@prisma/adapter-pg`) |
| Database        | PostgreSQL (Neon)                                           |
| Auth            | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`)                   |
| Validation      | Zod                                                         |
| Rate limit      | `express-rate-limit` v8                                     |
| Build           | `tsup` → single-file bundle at `api/server.js`              |
| Package manager | pnpm                                                        |

---

## Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- A PostgreSQL database (Neon free tier works)

### Local install

```bash
git clone <your-repo-url> DevSubmitServer
cd DevSubmitServer
pnpm install
cp .env.example .env
# Edit .env — fill in DATABASE_URL and JWT_SECRET
```
