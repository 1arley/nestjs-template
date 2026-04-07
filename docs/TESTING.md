# Testing Guide

This project uses Jest with Supertest for e2e tests and NestJS's testing utilities for unit tests.

## Structure

```
src/
├── auth/
│   ├── auth.service.ts
│   └── auth.service.spec.ts      ← unit tests
test/
├── app.e2e-spec.ts               ← e2e: health check
└── auth.e2e-spec.ts              ← e2e: auth flow
```

## Running Tests

```bash
npm test                # unit tests
npm run test:watch       # unit tests in watch mode
npm run test:cov         # unit tests with coverage
npm run test:e2e         # end-to-end tests
```

## Writing Unit Tests

Unit tests mock all dependencies (Prisma, JwtService, etc.) to test business logic in isolation.

Example — testing a service that uses Prisma:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { SomeService } from './some.service'

describe('SomeService', () => {
    let service: SomeService

    const mockPrisma = {
        item: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SomeService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile()

        service = module.get<SomeService>(SomeService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should return all items', async () => {
        const items = [{ id: '1', name: 'Test' }]
        mockPrisma.item.findMany.mockResolvedValue(items)

        const result = await service.findAll()

        expect(result).toEqual(items)
        expect(mockPrisma.item.findMany).toHaveBeenCalled()
    })

    it('should throw NotFoundException if not found', async () => {
        mockPrisma.item.findUnique.mockResolvedValue(null)

        await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
    })
})
```

Key patterns:
- Mock Prisma's `findMany`, `findUnique`, `create`, `update`, `delete` with `jest.fn()`
- Use `afterEach(() => jest.clearAllMocks())` to isolate test cases
- Test the happy path AND edge cases (not found, unauthorized, duplicates)

## Writing E2E Tests

E2E tests spin up the real application with an actual database:

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('SomeController (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = module.createNestApplication()
        app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
        await app.init()
        prisma = app.get<PrismaService>(PrismaService)
    })

    afterAll(async () => {
        await prisma.$disconnect()
        await app.close()
    })

    beforeEach(async () => {
        await prisma.item.deleteMany()
    })

    it('should create a new item', () => {
        return request(app.getHttpServer())
            .post('/items')
            .send({ name: 'Test Item' })
            .expect(201)
            .expect((res) => {
                expect(res.body.name).toBe('Test Item')
            })
    })
})
```

Key points:
- The e2e test uses the real AppModule so Prisma connects to the actual test database
- Clean up the database in `beforeEach` to keep tests isolated
- Use Supertest's `.expect(status)` and `.expect(fn)` chains for readable assertions

## Tips

1. Run frequently during development with `npm run test:watch` — it's faster than waiting until the end
2. Test service-level logic with unit tests first, then verify the full flow with e2e
3. Keep test data descriptive and minimal — use `Test User`, `test@example.com` instead of creative values
4. When adding new guards to a controller, ensure both unit and e2e tests cover the authorization paths
