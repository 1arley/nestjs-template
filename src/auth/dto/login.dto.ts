import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string

    @ApiProperty({
        example: 'password123',
        description: 'User password',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters.' })
    password: string
}
