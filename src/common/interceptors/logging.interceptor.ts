import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP')

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest()
        const { method, url } = request
        const userAgent = request.get('user-agent') || ''
        const ip = request.ip

        this.logger.log(`${method} ${url} from ${ip} [${userAgent}]`)

        const now = Date.now()

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse()
                    const { statusCode } = response
                    const responseTime = Date.now() - now

                    this.logger.log(`${method} ${url} ${statusCode} in ${responseTime}ms`)
                },
                error: (error) => {
                    const responseTime = Date.now() - now
                    this.logger.error(
                        `${method} ${url} - ${error.message} (${responseTime}ms)`,
                    )
                },
            }),
        )
    }
}
