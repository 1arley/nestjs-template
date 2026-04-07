# Getting Started — Verification Checklist

After cloning this repo or setting up a dev environment, run through these steps to make sure everything works.

## Quick Verification

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start the database (Docker)
npm run docker:up

# 4. Apply migrations and seed
npx prisma migrate dev
npm run prisma:seed

# 5. Run tests
npm test

# 6. Start the app
npm run dev
```

Once the server is running:

- Hit `http://localhost:3000/api` — you should see a JSON response with status info
- Hit `http://localhost:3000/api/docs` — Swagger UI should load

## If Something Breaks

| Symptom                        | Fix                                         |
|------------------------------- |--------------------------------------------  |
| `Cannot find module ...`       | Run `npm install` again                      |
| `Prisma Client not generated`  | Run `npm run prisma:generate`                |
| `Database connection failed`   | Confirm PostgreSQL is running, check `DATABASE_URL` |
| `Port 3000 already in use`     | Kill the process or change the `PORT` env var |
| `E2E tests failing`            | Ensure `npm run docker:up` ran successfully  |
| `ESLint warnings`              | Run `npm run lint`                           |

## Next Steps

- Read [AUTHENTICATION.md](./AUTHENTICATION.md) to understand the auth system
- Read [MODULE_CREATION.md](./MODULE_CREATION.md) to add new features
- Read [TESTING.md](./TESTING.md) for writing tests
