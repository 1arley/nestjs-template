import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { name, email, password, role } = registerDto

        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        })

        // Prevent privilege escalation during registration
        if (role === 'ADMIN' || role === 'SUPERADMIN') {
            throw new ForbiddenException(
                'You cannot assign administrative roles during registration.',
            )
        }

        if (existingUser) {
            throw new ConflictException('Email is already registered.')
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'USER',
            },
        })

        const { password: _, refreshToken: __, ...userClean } = user

        return {
            message: 'User registered successfully.',
            user: userClean,
        }
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto

        const user = await this.prisma.user.findUnique({
            where: { email },
        })

        if (!user) throw new UnauthorizedException('Invalid credentials.')

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials.')

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        }

        const token = this.jwtService.sign(payload, { expiresIn: '15m' })
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' })

        // Hash the refresh token before persisting
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10)

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedRefreshToken },
        })

        const { password: _, refreshToken: __, ...userClean } = user

        return {
            access_token: token,
            refresh_token: refreshToken,
            user: userClean,
        }
    }

    async validateUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) throw new UnauthorizedException('User not found.')

        const { password: _, refreshToken: __, ...userClean } = user
        return userClean
    }

    async refreshTokens(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken)

            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            })

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Access denied.')
            }

            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken)

            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Access denied. Invalid token.')
            }

            const newPayload = {
                sub: user.id,
                email: user.email,
                role: user.role,
            }

            const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' })
            const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '7d' })

            const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10)
            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: hashedRefreshToken },
            })

            return {
                access_token: newAccessToken,
                refresh_token: newRefreshToken,
            }

        } catch (error) {
            throw new UnauthorizedException('Invalid or expired refresh token. Please login again.')
        }
    }
}
