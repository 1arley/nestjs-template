# Creating New Modules

## Anatomy

Each feature lives in its own module following NestJS's modular architecture:

```
src/posts/
├── posts.module.ts          # NestJS module definition
├── posts.controller.ts      # HTTP route handlers
├── posts.service.ts         # Business logic
└── dto/
    ├── create-post.dto.ts   # Validation for POST body
    └── update-post.dto.ts   # Validation for PATCH body
```

## Step-by-Step: Adding a New Module

### 1. Update the Database Schema

Add your model to `prisma/schema.prisma`:

```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  content   String
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("posts")
}
```

Then run the migration:

```bash
npx prisma migrate dev --name add_posts
```

### 2. Generate the Module

Use the NestJS CLI:

```bash
npx nest g module posts
npx nest g controller posts
npx nest g service posts
```

### 3. Create DTOs

**`src/posts/dto/create-post.dto.ts`**

```typescript
import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class CreatePostDto {
    @ApiProperty({ example: 'My Post', description: 'Title' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string

    @ApiProperty({ example: 'Content...', description: 'Body' })
    @IsString()
    @IsNotEmpty()
    content: string
}
```

**`src/posts/dto/update-post.dto.ts`**

```typescript
import { PartialType } from '@nestjs/swagger'
import { CreatePostDto } from './create-post.dto'

export class UpdatePostDto extends PartialType(CreatePostDto) {}
```

### 4. Implement the Service

```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService) {}

    findAll() {
        return this.prisma.post.findMany({ orderBy: { createdAt: 'desc' } })
    }

    async findOne(id: string) {
        const post = await this.prisma.post.findUnique({ where: { id } })
        if (!post) throw new NotFoundException('Post not found.')
        return post
    }

    create(dto: CreatePostDto, authorId: string) {
        return this.prisma.post.create({ data: { ...dto, authorId } })
    }

    async update(id: string, dto: UpdatePostDto) {
        const post = await this.prisma.post.findUnique({ where: { id } })
        if (!post) throw new NotFoundException('Post not found.')
        return this.prisma.post.update({ where: { id }, data: dto })
    }

    async remove(id: string) {
        const post = await this.prisma.post.findUnique({ where: { id } })
        if (!post) throw new NotFoundException('Post not found.')
        await this.prisma.post.delete({ where: { id } })
        return { message: 'Post deleted.' }
    }
}
```

### 5. Implement the Controller

```typescript
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { PostsService } from './posts.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('posts')
@Controller('posts')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Get()
    findAll() {
        return this.postsService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id)
    }

    @Post()
    @ApiOperation({ summary: 'Create a new post' })
    create(@Body() dto: CreatePostDto, @CurrentUser() user: any) {
        return this.postsService.create(dto, user.id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
        return this.postsService.update(id, dto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.postsService.remove(id)
    }
}
```

### 6. Register in AppModule

```typescript
import { PostsModule } from './posts/posts.module'

@Module({
    imports: [
        // ... existing modules
        PostsModule,
    ],
})
export class AppModule {}
```

### 7. Add Role-Based Access (Optional)

```typescript
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { Role } from '../common/enums/role.enum'

// Any authenticated user
@Post()
@UseGuards(JwtAuthGuard)
create() { ... }

// Admins only
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
remove() { ... }
```

## Naming Conventions

| Resource     | Pattern              |
|------------- |----------------------|
| Module       | `*.module.ts`        |
| Controller   | `*.controller.ts`    |
| Service      | `*.service.ts`       |
| DTO create   | `create-*.dto.ts`    |
| DTO update   | `update-*.dto.ts`    |
| Guard        | `*.guard.ts`         |
| Test unit    | `*.spec.ts`          |
| Test e2e     | `*.e2e-spec.ts`      |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add posts module with CRUD operations
fix: prevent unauthorized post deletion
docs: add API examples
test: add unit tests for posts service
```
