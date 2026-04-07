import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator'
import { Role } from '../../common/enums/role.enum'

export class CreateUserDto {
    @ApiProperty({
        example: 'Jane Smith',
        description: 'Full display name',
    })
    @IsString()
    @IsNotEmpty({ message: 'Name is required.' })
    name: string

    @ApiProperty({
        example: 'jane@example.com',
        description: 'Unique email address',
    })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email: string

    @ApiProperty({
        example: 'securePass123',
        description: 'Minimum 8 characters',
        minLength: 8,
    })
    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters.' })
    password: string

    @ApiProperty({
        example: 'USER',
        description: 'User role assignment',
        enum: Role,
        required: false,
        default: Role.USER,
    })
    @IsEnum(Role, { message: 'Invalid role.' })
    @IsOptional()
    role?: Role
}
