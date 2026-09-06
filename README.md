# SellIt (Productify)

A full-stack product-sharing platform where creators can **upload, discover, and comment on products** — all wrapped in a clean, modern UI.

![Status](https://img.shields.io/badge/status-in%20development-orange) ![License](https://img.shields.io/badge/license-ISC-blue)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone & Install](#1-clone--install)
  - [2. Set Up Environment Variables](#2-set-up-environment-variables)
  - [3. Run the Application](#3-run-the-application)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
  - [Users](#users)
  - [Products](#products)
  - [Comments](#comments)
- [Docker Deployment](#docker-deployment)
- [Roadmap](#roadmap)

## Features

- **User Authentication** — Secure sign-in/sign-up powered by [Clerk](https://clerk.com) (email, Google, GitHub, and more).
- **User Sync** — Users are automatically created/updated in the database the first time they sign in.
- **Create & Showcase Products** — Upload a title, description, and image URL to share a product with the community.
- **Discover Products** — Browse all products on the home page, newest first, with a dedicated product detail page.
- **Manage Your Products** — Edit or delete your own products (owner-only actions).
- **Comments** — Leave comments on any product and manage the ones you write.
- **Personal Profile** — View all products you've created in one place.
- **Modern UI** — Built with Tailwind CSS + DaisyUI with multiple built-in themes.

## Tech Stack

| Layer       | Technology                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------- |
| **Frontend**| React 19, Vite, React Router, Tailwind CSS 4, DaisyUI, Lucide icons                          |
| **Backend** | Node.js, Express 5, TypeScript, Drizzle ORM                                                  |
| **Database**| PostgreSQL ([Neon](https://neon.tech) serverless) with a connection pool                    |
| **Auth**    | Clerk (`@clerk/express` on the server, `@clerk/clerk-react` + modal UI on the client)       |
| **Data Fetching** | TanStack Query for caching & server state, Axios with an auth token interceptor       |
| **Deployment** | Docker & Docker Compose (Nginx for the frontend, multi-stage Node builds)               |

## Architecture

A traditional monorepo with two independently deployable services:

```
┌──────────────────┐   REST /api (Bearer token)   ┌──────────────────┐
│    Frontend      │ ───────────────────────────► │     Backend      │
│  React + Vite    │ ◄─────────────────────────── │  Express + Drizzle│
│  Clerk UI        │         JSON responses       │  Clerk (requireAuth)
└──────────────────┘                              └────────┬─────────┘
                                                           │ SQL
                                                    ┌──────▼──────┐
                                                    │ PostgreSQL │
                                                    │  (Neon)    │
                                                    └─────────────┘
```

**Auth flow**

1. The client signs in through Clerk's hosted UI and receives a session token.
2. An Axios request interceptor attaches that token as a `Bearer` header (`frontend/src/hooks/useAuthReq.js`).
3. The backend verifies it with Clerk middleware, then uses `getAuth(req).userId` (the Clerk ID) to identify the current user.
4. On first sign-in, `POST /api/users/sync` creates the user row in the database (`users.id` = Clerk user ID).

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **PostgreSQL** — a local instance or a managed one like [Neon](https://neon.tech)
- A **Clerk** application (<https://dashboard.clerk.com>) with a publishable and secret key

### 1. Clone & Install

```bash
git clone https://github.com/burakorkmez/productify.git
cd productify

# Install dependencies for both services
npm install --prefix backend
npm install --prefix frontend
```

### 2. Set Up Environment Variables

Clerk provides a JWT template so your publishable/secret keys are not stored in the repo. Create the two env files and fill in your own values.

**`backend/.env`**

```env
PORT=3000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require
NODE_ENV=development
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`**

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_URL=http://localhost:3000/api
```

> **Note** — Environment variables are read at build time on the frontend, so restart the Vite dev server after changing them.

### 3. Run the Application

```bash
# Terminal 1 — backend (http://localhost:3000)
npm run dev --prefix backend

# Terminal 2 — frontend (http://localhost:5173)
npm run dev --prefix frontend
```

Migrate the database schema before the first run:

```bash
npm run db:push --prefix backend
```

Then open <http://localhost:5173> — the backend health check is available at <http://localhost:3000/api/health>.

## Project Structure

```
productify/
├── backend/                      # Express + TypeScript REST API
│   ├── src/
│   │   ├── config/env.ts         # Environment variable loader
│   │   ├── controllers/          # Request/response handlers
│   │   ├── db/
│   │   │   ├── index.ts          # PostgreSQL pool + Drizzle client
│   │   │   ├── schema.ts         # Tables & relations (users, products, comments)
│   │   │   └── queries.ts        # Data-access functions
│   │   ├── routes/               # Express routers
│   │   └── index.ts              # App entry point
│   ├── drizzle.config.ts         # Drizzle Kit config
│   └── package.json
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── components/           # Navbar, ProductCard, CommentsSection, forms...
│   │   ├── hooks/                # TanStack Query hooks + auth sync
│   │   ├── lib/                  # Axios instance & API client
│   │   ├── pages/                # Home, Product, Profile, Create, Edit
│   │   ├── App.jsx               # Route definitions
│   │   └── main.jsx              # Clerk, Router, Query providers
│   ├── nginx.conf                # Nginx config for production build
│   └── package.json
├── docker-compose.yml            # Runs both services in production
├── Dockerfile.dev                # Development container
└── package.json                  # Root build/start orchestration
```

## Database Schema

| Table      | Fields                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------ |
| **users**  | `id` (text, PK = Clerk user ID), `email` (unique), `name`, `image_url`, `created_at`, `updated_at` |
| **products** | `id` (uuid, PK), `title`, `description`, `image_url`, `user_id` (FK → users, cascade), `created_at`, `updated_at` |
| **comments** | `id` (uuid, PK), `content`, `user_id` (FK → users, cascade), `product_id` (FK → products, cascade), `created_at` |

Relations (defined in `backend/src/db/schema.ts`):

- One **user** has many **products** and many **comments**
- One **product** belongs to one **user** and has many **comments**
- One **comment** belongs to one **user** and one **product**

## API Reference

Base URL: `http://localhost:3000/api` — endpoints marked 🔒 require a valid Clerk `Bearer` token.

### Users

| Method | Endpoint      | Description                                 | Auth |
| ------ | ------------- | ------------------------------------------- | ---- |
| POST   | `/users/sync` | Upsert the signed-in user into the database | 🔒   |

### Products

| Method | Endpoint          | Description                              | Auth |
| ------ | ----------------- | ---------------------------------------- | ---- |
| GET    | `/products`       | Get all products (newest first)          |      |
| GET    | `/products/:id`   | Get a single product (with creator & comments) |     |
| GET    | `/products/my`    | Get the current user's products          | 🔒   |
| POST   | `/products`       | Create a product (`title`, `description`, `imageUrl`) | 🔒 |
| PUT    | `/products/:id`   | Update a product (owner only)            | 🔒   |
| DELETE | `/products/:id`   | Delete a product (owner only)            | 🔒   |

### Comments

| Method | Endpoint               | Description                      | Auth |
| ------ | ---------------------- | -------------------------------- | ---- |
| POST   | `/comments/:productId` | Add a comment to a product       | 🔒   |
| DELETE | `/comments/:commentId` | Delete a comment (owner only)    | 🔒   |

## Docker Deployment

For production, the project ships with a full Docker setup (`docker-compose.yml`, multi-stage `Dockerfile`s, and Nginx). Follow the detailed guide in **[DOCKER_SETUP.md](DOCKER_SETUP.md)**.

Quick start:

```bash
cp .env.docker .env   # fill in your DATABASE_URL + Clerk keys
docker compose up -d
```

- Frontend: <http://localhost>
- Backend API: <http://localhost:3000/api>

## Roadmap

- [ ] Move user sync to a Clerk **webhook** instead of the client (more reliable & secure)
- [ ] Add form validation and richer product fields (links, tags, categories)
- [ ] Add like/vote functionality on products
- [ ] Pagination and search for products
- [ ] Add automated tests