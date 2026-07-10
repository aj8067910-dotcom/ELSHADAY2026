import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

/**
 * Endpoint público e barato para monitoramento e keep-alive
 * (ex.: UptimeRobot pingando a cada 5 min para evitar hibernação).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { ok: true, service: 'elshaday-api', ts: new Date().toISOString() };
  }
}
