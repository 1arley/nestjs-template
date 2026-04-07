import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { Role } from '../common/enums/role.enum'

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) {}

    async findAll() {
        const users = await this.prisma.user.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        })

        return users.map(({ password, ...user }) => user)
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            throw new NotFoundException('User not found.')
        }

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    async findByEmail(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            throw new NotFoundException('User not found.')
        }

        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    async create(createUserDto: CreateUserDto) {
        const { name, email, password, role } = createUserDto

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            throw new ConflictException('Email is already registered.')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || Role.USER,
            },
        })

        const { password: _, ...userWithoutPassword } = user
        return userWithoutPassword
    }

    async update(id: string, updateUserDto: UpdateUserDto, requestingUser: any) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            throw new NotFoundException('User not found.')
        }

        // Users can only edit their own profile unless they're an admin
        if (requestingUser.id !== id && requestingUser.role === Role.USER) {
            throw new ForbiddenException('You do not have permission to update this user.')
        }

        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const emailExists = await this.prisma.user.findUnique({
                where: { email: updateUserDto.email },
            })

            if (emailExists) {
                throw new ConflictException('Email is already registered.')
            }
        }

        const updateData: any = { ...updateUserDto }
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(updateUserDto.password, 10)
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: updateData,
        })

        const { password: _, ...userWithoutPassword } = updatedUser
        return userWithoutPassword
    }

    async remove(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        })

        if (!user) {
            throw new NotFoundException('User not found.')
        }

        await this.prisma.user.delete({
            where: { id },
        })

        return {
            message: 'User deleted successfully.',
        }
    }
}
