import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'ketris-api',
      database: process.env.DATABASE_URL ? 'configured' : 'not-configured',
    };
  }
}
