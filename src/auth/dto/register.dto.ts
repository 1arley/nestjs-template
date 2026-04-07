import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator'
import { Role } from '../../common/enums/role.enum'

export class RegisterDto {
    @ApiProperty({
        example: 'John Doe',
        description: 'Full display name',
    })
    @IsString()
    @IsNotEmpty({ message: 'Name is required.' })
    name: string

    @ApiProperty({
        example: 'john@example.com',
        description: 'Unique email address',
    })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string

    @ApiProperty({
        example: 'password123',
        description: 'Minimum 8 characters',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters.' })
    password: string

    @ApiProperty({
        example: 'USER',
        description: 'Assigned role (optional; defaults to USER)',
        enum: Role,
        required: false,
        default: Role.USER,
    })
    @IsEnum(Role, { message: 'Role must be one of: USER, ADMIN, SUPERADMIN.' })
    @IsOptional()
    role?: Role
}
