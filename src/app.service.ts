import { Injectable } from '@nestjs/common'

@Injectable()
export class AppService {
    getHealth() {
        return {
            message: 'Nest API Starter is running',
            version: '1.0.0',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        }
    }
}
