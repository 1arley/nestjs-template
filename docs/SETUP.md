# Setup Guide — Nest API Starter

## Prerequisites

- **Node.js** >= 20.x ([Download](https://nodejs.org/))
- **npm** >= 9.x
- **Docker** & **Docker Compose** (recommended) ([Download](https://www.docker.com/))
- **PostgreSQL** 15+ (if not using Docker) ([Download](https://www.postgresql.org/))
- **Git**

---

## Method 1: Docker (Recommended)

### Step 1: Clone & configure

```bash
npm install
cp .env.example .env
```

Edit `.env` if needed:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_api_db?schema=public"
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
```

### Step 2: Start containers

```bash
npm run docker:up
```

This will:
- Start PostgreSQL and pgAdmin
- Run Prisma migrations automatically
- Seed the database with test users
- Start the application in development mode

### Step 3: Verify

- **API**: http://localhost:3000/api
- **Swagger**: http://localhost:3000/api/docs
- **pgAdmin**: http://localhost:5050 (email: admin@example.com, password: admin)

### Useful Docker commands

```bash
npm run docker:logs      # View logs
npm run docker:down      # Stop containers
docker exec -it onearley-api sh   # Shell into app
docker exec -it onearley-db psql -U postgres -d nest_api_db  # PSQL shell
```

---

## Method 2: Local (No Docker)

### Step 1: Install & configure

```bash
npm install
cp .env.example .env
```

### Step 2: Create database

```sql
CREATE DATABASE nest_api_db;
```

Update `DATABASE_URL` in `.env` accordingly.

### Step 3: Migrate & seed

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### Step 4: Start

```bash
npm run dev
```

---

## Verify Installation

### Health check

```bash
curl http://localhost:3000/api
```

Expected response:

```json
{
  "message": "Nest API Starter is running",
  "version": "1.0.0",
  "uptime": 120.5,
  "timestamp": "2026-04-07T10:00:00.000Z"
}
```

### Test credentials (after seeding)

| Role       | Email                  | Password  |
|------------|------------------------|-----------|
| SUPERADMIN | superadmin@example.com | admin123  |
| ADMIN      | admin@example.com      | admin123  |
| USER       | user@example.com       | user123   |

---

## Troubleshooting

### Port 3000 already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Prisma Client not generated

```bash
npm run prisma:generate
```

### Can't connect to database

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Check port 5432 isn't blocked

### Migrations stuck

```bash
npx prisma migrate status   # Check state
npx prisma migrate deploy   # Apply pending
npx prisma migrate reset    # Full reset (deletes data)
```

---

## Next Steps

- See [MODULE_CREATION.md](./MODULE_CREATION.md) for creating new modules
- See [AUTHENTICATION.md](./AUTHENTICATION.md) for auth details
- See [TESTING.md](./TESTING.md) for testing patterns
