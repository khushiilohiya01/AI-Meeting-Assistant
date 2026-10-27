import { Controller, Get, Res, Header } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';

@Controller()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('calendar/events')
  async getEvents() {
    return await this.calendarService.getEvents();
  }

  @Get('deadlines')
  async getDeadlines() {
    return await this.calendarService.getDeadlines();
  }

  @Get('calendar/export.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="meettrack_calendar.ics"')
  async exportIcs(@Res() res: Response) {
    const icsContent = await this.calendarService.exportIcs();
    res.send(icsContent);
  }
}
