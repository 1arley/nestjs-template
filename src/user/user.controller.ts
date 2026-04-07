import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { RolesGuard } from '../auth/roles.guard'
import { Roles } from '../auth/roles.decorator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { Role } from '../common/enums/role.enum'

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @ApiOperation({ summary: 'List all users (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                },
            },
        },
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    findAll() {
        return this.userService.findAll()
    }

    @Get(':id')
    @ApiOperation({ summary: 'Find a single user by ID' })
    @ApiResponse({ status: 200, description: 'User found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    findOne(@Param('id') id: string) {
        return this.userService.findOne(id)
    }

    @Post()
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @ApiOperation({ summary: 'Create a new user (admin only)' })
    @ApiResponse({ status: 201, description: 'User created' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto)
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update own profile or any user (admin)' })
    @ApiResponse({ status: 200, description: 'User updated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Email already registered' })
    update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() user: any,
    ) {
        return this.userService.update(id, updateUserDto, user)
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.SUPERADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete a user (admin only)' })
    @ApiResponse({ status: 200, description: 'User deleted' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'User not found' })
    remove(@Param('id') id: string) {
        return this.userService.remove(id)
    }
}
