import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'

@ApiTags('health')
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    @ApiResponse({
        status: 200,
        description: 'API is running',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Nest API Starter is running' },
                version: { type: 'string', example: '1.0.0' },
                uptime: { type: 'number', example: 120.5 },
                timestamp: {
                    type: 'string',
                    example: '2026-04-07T10:30:00.000Z',
                },
            },
        },
    })
    getHealth() {
        return this.appService.getHealth()
    }
}
