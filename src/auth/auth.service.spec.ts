import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

describe('AuthService', () => {
    let service: AuthService
    let prisma: PrismaService

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    }

    const mockJwtService = {
        sign: jest.fn().mockReturnValue('fake-jwt-token'),
        verify: jest.fn().mockReturnValue({ sub: 'user-1' }),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile()

        service = module.get<AuthService>(AuthService)
        prisma = module.get<PrismaService>(PrismaService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('register', () => {
        const registerDto = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'Password123!',
        }

        it('should register a new user successfully', async () => {
            const createdUser = {
                id: 'user-1',
                name: registerDto.name,
                email: registerDto.email,
                password: 'hashed',
                role: 'USER',
                createdAt: new Date(),
                updatedAt: new Date(),
                refreshToken: null,
            }

            mockPrismaService.user.findUnique.mockResolvedValue(null)
            mockPrismaService.user.create.mockResolvedValue(createdUser)

            const result = await service.register(registerDto)

            expect(result).toHaveProperty('user')
            expect(result).toHaveProperty('message')
            expect(result.user.email).toBe(registerDto.email)
            expect(result.user.password).toBeUndefined()
        })

        it('should throw ConflictException if email already exists', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-1',
                email: registerDto.email,
            })

            await expect(service.register(registerDto)).rejects.toThrow(ConflictException)
            expect(prisma.user.findUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            })
            expect(prisma.user.create).not.toHaveBeenCalled()
        })

        it('should prevent role escalation during registration', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            const maliciousDto = {
                ...registerDto,
                role: 'ADMIN',
            }

            await expect(service.register(maliciousDto)).rejects.toThrow(ForbiddenException)
            expect(prisma.user.create).not.toHaveBeenCalled()
        })
    })

    describe('login', () => {
        const loginDto = {
            email: 'test@example.com',
            password: 'Password123!',
        }

        it('should login with valid credentials', async () => {
            const user = {
                id: 'user-1',
                name: 'Test User',
                email: loginDto.email,
                password: await bcrypt.hash(loginDto.password, 12),
                role: 'USER',
                refreshToken: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            }

            mockPrismaService.user.findUnique.mockResolvedValue(user)

            const result = await service.login(loginDto)

            expect(result).toHaveProperty('access_token')
            expect(result).toHaveProperty('refresh_token')
            expect(result.user.email).toBe(loginDto.email)
            expect(result.user.password).toBeUndefined()
        })

        it('should throw UnauthorizedException if user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
        })

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const user = {
                id: 'user-1',
                email: loginDto.email,
                password: await bcrypt.hash('DifferentPassword', 12),
                role: 'USER',
                refreshToken: null,
            }

            mockPrismaService.user.findUnique.mockResolvedValue(user)

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException)
        })
    })

    describe('validateUser', () => {
        it('should return user when ID is valid', async () => {
            const user = {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'USER',
                refreshToken: null,
                password: 'hashed',
            }

            mockPrismaService.user.findUnique.mockResolvedValue(user)

            const result = await service.validateUser('user-1')

            expect(result.id).toBe('user-1')
            expect(result.password).toBeUndefined()
            expect(result.refreshToken).toBeUndefined()
        })

        it('should throw UnauthorizedException if user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            await expect(service.validateUser('nonexistent')).rejects.toThrow(UnauthorizedException)
        })
    })
});
