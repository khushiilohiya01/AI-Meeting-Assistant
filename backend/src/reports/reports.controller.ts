import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async findAll() {
    return await this.reportsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.reportsService.findOne(id);
  }

  @Post(':id/share')
  async createShare(
    @Param('id') id: string,
    @Body() body: { includeTranscript?: boolean; expiryHours?: number },
  ) {
    return await this.reportsService.createShareLink(id, body);
  }

  @Delete(':id/share/:shareId')
  async revokeShare(@Param('id') id: string, @Param('shareId') shareId: string) {
    return await this.reportsService.revokeShareLink(id, shareId);
  }
}

@Controller('meetings')
export class MeetingReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':id/report')
  async getMeetingReport(@Param('id') id: string) {
    return await this.reportsService.findByMeetingId(id);
  }

  @Get(':id/transcript')
  async getMeetingTranscript(@Param('id') id: string) {
    return await this.reportsService.getTranscript(id);
  }
}

@Controller('public/shares')
export class PublicSharesController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':token')
  async resolveShare(@Param('token') token: string) {
    return await this.reportsService.resolvePublicShare(token);
  }
}
