import { IsString, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  joinUrl?: string;

  @IsOptional()
  agenda?: string[] | string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  participants?: any[];
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  status?: any;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  joinUrl?: string;

  @IsOptional()
  agenda?: string[] | string;

  @IsOptional()
  @IsString()
  notes?: string;
}
