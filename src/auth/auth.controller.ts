import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, Res, Req, Get, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { JwtAuthGuard } from './jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User registered successfully.' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        role: { type: 'string', example: 'USER' },
                        createdAt: { type: 'string', example: '2026-04-07T10:00:00.000Z' },
                        updatedAt: { type: 'string', example: '2026-04-07T10:00:00.000Z' },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto)
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Authenticate user and receive access token' })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                access_token: {
                    type: 'string',
                    description: 'Short-lived access token (expires in 15 minutes)',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        role: { type: 'string', example: 'USER' },
                        createdAt: { type: 'string', example: '2026-04-07T10:00:00.000Z' },
                        updatedAt: { type: 'string', example: '2026-04-07T10:00:00.000Z' },
                    },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.login(loginDto)

        // Store refresh token as an httpOnly cookie to prevent XSS
        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        const { refresh_token, ...safeResult } = result

        return safeResult
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Rotate refresh tokens and get a new access token' })
    @ApiResponse({
        status: 200,
        description: 'Tokens rotated successfully',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'new_access_token_here' },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Missing, invalid, or expired refresh token' })
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies['refresh_token']

        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token provided.')
        }

        const result = await this.authService.refreshTokens(refreshToken)

        // Issue a new refresh token via rotation
        res.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        const { refresh_token, ...safeResult } = result

        return safeResult
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get the authenticated user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getProfile(@CurrentUser() user: any) {
        return user
    }
}
