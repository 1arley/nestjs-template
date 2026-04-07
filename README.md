# Nest API Starter

<div align="center">

![NestJS](https://img.shields.io/badge/NestJS-v11.0.1-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-v6.16.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Production-ready boilerplate with JWT auth (refresh token rotation), Prisma ORM, Swagger, and Docker**

[Quick Start](#quick-start) | [Features](#features) | [Docs](#-documentation)

</div>

---

## Overview

Opinionated starter template for building REST APIs with NestJS. Includes everything you need to spin up a secure, well-structured backend: authentication, database, validation, Docker setup, and API docs.

### What's Included

- **JWT authentication** with access + refresh tokens, httpOnly cookies, and automatic token rotation
- **Role-based access control** (USER, ADMIN, SUPERADMIN) via guards and decorators
- **Prisma ORM** with PostgreSQL, type-safe queries, and migrations
- **Docker Compose** stack with PostgreSQL and pgAdmin for local development
- **Swagger/OpenAPI** docs generated automatically from decorators
- **DTO validation** with `class-validator` and `class-transformer`
- **Rate limiting** via `@nestjs/throttler`
- **Global exception filters** and **logging interceptors**
- **Jest** unit and e2e test scaffolding

---

## Tech Stack

| Layer       | Stack                                                                 |
|-------------|-----------------------------------------------------------------------|
| Framework   | NestJS v11, TypeScript v5                                             |
| Database     | PostgreSQL 15, Prisma v6 ORM                                          |
| Auth        | `@nestjs/jwt`, `passport-jwt`, `bcrypt`                               |
| Validation  | `class-validator`, `class-transformer`                                |
| Docs        | `@nestjs/swagger`, `swagger-ui-express`                               |
| DevOps      | Docker Compose, Alpine-based multi-stage builds                       |
| Testing     | Jest, Supertest                                                       |
| Quality     | ESLint (flat config), Prettier                                        |

---

## Quick Start

### 1. Create a new repo from this template

Use the GitHub **Use this template** button, then clone:

```bash
git clone https://github.com/your-username/your-project.git
cd your-project
```

Or clone directly and swap the remote:

```bash
git clone https://github.com/1arley/nestjs-template.git my-project
cd my-project
git remote remove origin
git remote add origin https://github.com/your-username/my-project.git
```

### 2. Install & configure

```bash
npm install

cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and JWT_ACCESS_SECRET
```

### 3. Start the database (Docker)

```bash
docker-compose up -d
npx prisma migrate dev
npm run dev
```

### 4. Without Docker

Make sure PostgreSQL is running, then:

```bash
npx prisma migrate dev
npm run dev
```

The API will be available at `http://localhost:3000/api` with Swagger docs at `/api/docs`.

---

## Environment Variables

| Variable                  | Description                                        |
|---------------------------|----------------------------------------------------|
| `NODE_ENV`                 | Runtime environment (development / production)     |
| `DATABASE_URL`             | PostgreSQL connection string                       |
| `JWT_ACCESS_SECRET`        | Secret key used to sign short-lived access tokens  |
| `JWT_ACCESS_EXPIRES_IN`    | Access token TTL (default: `15m`)                  |
| `JWT_REFRESH_SECRET`       | Secret key used to sign refresh tokens             |
| `JWT_REFRESH_EXPIRES_IN`   | Refresh token TTL (default: `7d`)                  |
| `API_PREFIX`               | URL prefix for all routes (default: `api`)         |
| `SWAGGER_PATH`             | Path where Swagger UI is mounted (default: `api/docs`) |

Generate secure secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## API Endpoints

### Health

| Method | Path  | Description           |
|--------|-------|-----------------------|
| GET    | `/api` | Returns API status    |

### Auth

| Method | Path              | Description                          |
|--------|-------------------|--------------------------------------|
| POST   | `/api/auth/register`     | Create a new user                    |
| POST   | `/api/auth/login`        | Authenticate and receive tokens      |
| POST   | `/api/auth/refresh`      | Rotate refresh token for new tokens  |
| GET    | `/api/auth/profile`      | Get current user profile (protected) |

### Users (JWT protected)

| Method | Path               | Access                    |
|--------|--------------------|---------------------------|
| GET    | `/api/users`       | ADMIN, SUPERADMIN only    |
| GET    | `/api/users/:id`   | Any authenticated user    |
| POST   | `/api/users`       | ADMIN, SUPERADMIN only    |
| PATCH  | `/api/users/:id`   | Own profile or ADMIN      |
| DELETE | `/api/users/:id`   | ADMIN, SUPERADMIN only    |

---

## Auth Flow

1. **Register** → `POST /auth/register` creates account, returns user object
2. **Login** → `POST /auth/login` returns `access_token` (JWT) + sets httpOnly `refresh_token` cookie
3. **Call protected routes** → Attach `Bearer <access_token>` in `Authorization` header
4. **Refresh** → When access token expires, call `POST /auth/refresh` to get a new pair (the old refresh token is invalidated)

### Using Roles in Code

```typescript
import { Roles } from '../auth/roles.decorator'
import { Role } from '../common/enums/role.enum'

@Get()
@Roles(Role.ADMIN)
async adminOnly() {
    // Only users with ADMIN or SUPERADMIN role can access
}
```

---

## Project Structure

```
src/
├── main.ts                            # Entry point
├── app.module.ts                      # Root module
├── app.controller.ts                  # Health check
├── app.service.ts                     # Health service
│
├── auth/                              # Authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts             # register, login, refresh, profile
│   ├── auth.service.ts                # Business logic
│   ├── jwt.strategy.ts                # Passport JWT strategy
│   ├── jwt-auth.guard.ts              # Route guard
│   ├── roles.decorator.ts             # @Roles() metadata
│   ├── roles.guard.ts                 # Role enforcement guard
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── user/                              # User management
│   ├── user.module.ts
│   ├── user.controller.ts             # CRUD endpoints
│   ├── user.service.ts                # Business logic
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
│
├── prisma/
│   ├── prisma.module.ts               # Global Prisma provider
│   └── prisma.service.ts              # Connection lifecycle
│
├── common/
│   ├── decorators/
│   │   └── current-user.decorator.ts  # @CurrentUser() param decorator
│   ├── enums/
│   │   └── role.enum.ts               # Role values
│   ├── filters/
│   │   └── http-exception.filter.ts   # Standardized error responses
│   └── interceptors/
│       ├── logging.interceptor.ts     # Request/response logging
│       └── transform.interceptor.ts   # Wraps responses in {success, data, timestamp}
│
└── config/                            # (reserved for config modules)
```

---

## Scripts

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start in watch mode                  |
| `npm run build`       | Compile for production               |
| `npm run start:prod`  | Run compiled production build        |
| `npm test`            | Run unit tests                       |
| `npm run test:e2e`    | Run end-to-end tests                 |
| `npm run lint`        | lint + auto-fix                       |
| `npm run format`      | format with Prettier                  |
| `npm run prisma:seed` | Seed the database with test users    |
| `npm run prisma:studio`| Open Prisma Studio GUI               |
| `npm run docker:up`   | Start containers                     |
| `npm run docker:down` | Stop containers                      |

---

## Project Setup

For a detailed guide on getting started, see [docs/SETUP.md](docs/SETUP.md).

Additional documentation:

- [Authentication Guide](docs/AUTHENTICATION.md)
- [Module Creation Guide](docs/MODULE_CREATION.md)
- [Testing Guide](docs/TESTING.md)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes with [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add password reset endpoint
   fix: handle duplicate email in registration
   docs: update API examples in README
   ```
4. Push and open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by 1arley**

</div>
