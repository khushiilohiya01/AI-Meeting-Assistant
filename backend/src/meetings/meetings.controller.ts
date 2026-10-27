import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto/meeting.dto';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(@Body() dto: CreateMeetingDto) {
    return await this.meetingsService.create(dto);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('search') search?: string,
  ) {
    return await this.meetingsService.findAll({ status, platform, search });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.meetingsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return await this.meetingsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.meetingsService.remove(id);
  }

  @Post(':id/capture-session')
  async createCaptureSession(@Param('id') id: string) {
    return await this.meetingsService.createCaptureSession(id);
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return await this.meetingsService.getStatus(id);
  }

  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  async finalize(@Param('id') id: string) {
    return await this.meetingsService.finalizeAndGenerateReport(id);
  }

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.OK)
  async reprocess(@Param('id') id: string) {
    return await this.meetingsService.reprocess(id);
  }
}
