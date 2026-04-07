import { Test, TestingModule } from '@nestjs/testing'
import { UserService } from './user.service'
import { PrismaService } from '../prisma/prisma.service'
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common'

describe('UserService', () => {
    let service: UserService
    let prisma: PrismaService

    const mockPrismaService = {
        user: {
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
                UserService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile()

        service = module.get<UserService>(UserService)
        prisma = module.get<PrismaService>(PrismaService)
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('findAll', () => {
        it('should return array of users (without passwords)', async () => {
            const users = [
                {
                    id: 'user-1',
                    email: 'test@example.com',
                    name: 'Test User',
                    role: 'USER',
                    password: 'hashed',
                },
                {
                    id: 'user-2',
                    email: 'admin@example.com',
                    name: 'Admin User',
                    role: 'ADMIN',
                    password: 'hashed',
                },
            ]

            mockPrismaService.user.findMany.mockResolvedValue(users)

            const result = await service.findAll()

            expect(result).toHaveLength(2)
            expect(result[0]).not.toHaveProperty('password')
            expect(result[1]).not.toHaveProperty('password')
        })

        it('should return empty array when no users exist', async () => {
            mockPrismaService.user.findMany.mockResolvedValue([])

            const result = await service.findAll()

            expect(result).toEqual([])
        })
    })

    describe('findOne', () => {
        it('should return a single user', async () => {
            const user = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
                password: 'hashed',
            }

            mockPrismaService.user.findUnique.mockResolvedValue(user)

            const result = await service.findOne('user-1')

            expect(result.name).toBe('Test User')
            expect(result).not.toHaveProperty('password')
        })

        it('should throw NotFoundException when user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException)
        })
    })

    describe('update', () => {
        const updateDto = { name: 'Updated Name' }

        it('should allow user to update their own profile', async () => {
            const existingUser = {
                id: 'user-1',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
            }

            const updatedUser = { ...existingUser, name: updateDto.name }

            mockPrismaService.user.findUnique.mockResolvedValue(existingUser)
            mockPrismaService.user.update.mockResolvedValue(updatedUser)

            const result = await service.update('user-1', updateDto, { id: 'user-1', role: 'USER' })

            expect(result.name).toBe(updateDto.name)
        })

        it('should allow ADMIN to update any user', async () => {
            const existingUser = {
                id: 'user-2',
                email: 'test@example.com',
                name: 'Test User',
                role: 'USER',
            }

            mockPrismaService.user.findUnique.mockResolvedValue(existingUser)
            mockPrismaService.user.update.mockResolvedValue({
                ...existingUser,
                name: updateDto.name,
            })

            const result = await service.update('user-2', updateDto, { id: 'user-1', role: 'ADMIN' })

            expect(result.name).toBe(updateDto.name)
        })

        it('should throw ForbiddenException if USER tries to update another user', async () => {
            const existingUser = {
                id: 'user-2',
                name: 'Test User',
                role: 'USER',
            }

            mockPrismaService.user.findUnique.mockResolvedValue(existingUser)

            await expect(
                service.update('user-2', updateDto, { id: 'user-1', role: 'USER' }),
            ).rejects.toThrow(ForbiddenException)
            expect(prisma.user.update).not.toHaveBeenCalled()
        })

        it('should throw NotFoundException if user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            await expect(
                service.update('nonexistent', updateDto, { id: 'user-1', role: 'ADMIN' }),
            ).rejects.toThrow(NotFoundException)
        })
    })

    describe('remove', () => {
        it('should delete an existing user', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue({
                id: 'user-2',
                name: 'Test User',
                role: 'USER',
            })
            mockPrismaService.user.delete.mockResolvedValue({})

            const result = await service.remove('user-2')

            expect(result.message).toBe('User deleted successfully.')
            expect(prisma.user.delete).toHaveBeenCalledWith({
                where: { id: 'user-2' },
            })
        })

        it('should throw NotFoundException if user does not exist', async () => {
            mockPrismaService.user.findUnique.mockResolvedValue(null)

            await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException)
            expect(prisma.user.delete).not.toHaveBeenCalled()
        })
    })
});
