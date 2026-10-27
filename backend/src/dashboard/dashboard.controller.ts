import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard/overview')
  async getOverview() {
    return await this.dashboardService.getOverview();
  }

  @Get('search')
  async search(@Query('q') q: string) {
    return await this.dashboardService.globalSearch(q);
  }

  @Get('health')
  getHealth() {
    return this.dashboardService.getHealth();
  }
}
