import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import cookieParser = require('cookie-parser')
import compression = require('compression')

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // Global route prefix
    const apiPrefix = process.env.API_PREFIX || 'api'
    app.setGlobalPrefix(apiPrefix)

    // Response compression via gzip
    app.use(compression())

    // Remove x-powered-by header to avoid leaking tech stack
    app.disable('x-powered-by')

    // Cookie parser middleware
    app.use(cookieParser())

    // CORS setup
    app.enableCors({
        origin: process.env.CORS_ORIGIN?.split(',') || '*',
        credentials: process.env.CORS_CREDENTIALS === 'true',
    })

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter())

    // Global logging interceptor
    app.useGlobalInterceptors(new LoggingInterceptor())

    // Global validation pipe for all incoming requests
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    )

    // Swagger/OpenAPI setup
    const config = new DocumentBuilder()
        .setTitle('Nest API Starter')
        .setDescription(
            'Boilerplate for building REST APIs with NestJS, Prisma ORM, and JWT authentication.',
        )
        .setVersion('1.0.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Paste the JWT token from login response',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('health', 'Health check and diagnostics')
        .addTag('auth', 'Authentication operations')
        .addTag('users', 'User management')
        .build()

    const document = SwaggerModule.createDocument(app, config)
    const swaggerPath = process.env.SWAGGER_PATH || 'api/docs'
    SwaggerModule.setup(swaggerPath, app, document, {
        customSiteTitle: 'Nest API Starter Docs',
        customfavIcon: 'https://nestjs.com/img/logo-small.svg',
        customCss: '.swagger-ui .topbar { display: none }',
    })

    const port = Number(process.env.PORT) || 3000
    await app.listen(port)

    console.log(`\nServer listening on http://localhost:${port}/${apiPrefix}`)
    console.log(`API docs available at http://localhost:${port}/${swaggerPath}\n`)
}

bootstrap()
