import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { AppModule } from '../src/app.module'
import { PrismaService } from '../src/prisma/prisma.service'

describe('AuthController (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()

        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )

        await app.init()

        prisma = app.get<PrismaService>(PrismaService)
    })

    afterAll(async () => {
        await prisma.$disconnect()
        await app.close()
    })

    beforeEach(async () => {
        await prisma.user.deleteMany()
    })

    describe('/auth/register (POST)', () => {
        it('should register a new user', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123!',
                })
                .expect(201)
                .expect((res) => {
                    expect(res.body.user).toBeDefined()
                    expect(res.body.user.email).toBe('test@example.com')
                    expect(res.body.user.password).toBeUndefined()
                    expect(res.body.message).toBeDefined()
                })
        })

        it('should fail with duplicate email', async () => {
            await request(app.getHttpServer()).post('/auth/register').send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
            })

            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    name: 'Another User',
                    email: 'test@example.com',
                    password: 'Password456!',
                })
                .expect(409)
        })

        it('should fail with invalid data', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    name: 'Te',
                    email: 'not-an-email',
                    password: 'short',
                })
                .expect(400)
        })

        it('should fail with empty body', () => {
            return request(app.getHttpServer())
                .post('/auth/register')
                .send({})
                .expect(400)
        })
    })

    describe('/auth/login (POST)', () => {
        beforeEach(async () => {
            await request(app.getHttpServer()).post('/auth/register').send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'Password123!',
            })
        })

        it('should login with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Password123!',
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body.user).toBeDefined()
                    expect(res.body.user.email).toBe('test@example.com')
                    expect(res.body.access_token).toBeDefined()
                })
        })

        it('should fail with wrong password', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword!',
                })
                .expect(401)
        })

        it('should fail with nonexistent user', () => {
            return request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: 'noone@example.com',
                    password: 'Password123!',
                })
                .expect(401)
        })
    })

    describe('/auth/profile (GET)', () => {
        let authToken: string

        beforeEach(async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'Password123!',
                })

            authToken = response.body.access_token
        })

        it('should return the profile of the authenticated user', () => {
            return request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe('test@example.com')
                    expect(res.body.name).toBe('Test User')
                    expect(res.body.role).toBe('USER')
                    expect(res.body.password).toBeUndefined()
                })
        })

        it('should fail without a token', () => {
            return request(app.getHttpServer())
                .get('/auth/profile')
                .expect(401)
        })

        it('should fail with an invalid token', () => {
            return request(app.getHttpServer())
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401)
        })
    })
});
