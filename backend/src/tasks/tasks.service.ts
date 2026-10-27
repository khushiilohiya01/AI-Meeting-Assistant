import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TaskEntity } from '../database/entities/task.entity';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepo: Repository<TaskEntity>,
    @InjectRepository(MeetingEntity)
    private readonly meetingRepo: Repository<MeetingEntity>,
  ) {}

  async findAll(query?: {
    status?: string;
    priority?: string;
    assignee?: string;
    meeting?: string;
    dueDate?: string;
    overdue?: boolean;
    search?: string;
  }): Promise<any[]> {
    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.meeting', 'meeting')
      .orderBy('task.dueDate', 'ASC')
      .addOrderBy('task.createdAt', 'DESC');

    if (query?.status && query.status !== 'all') {
      qb.andWhere('task.status = :status', { status: query.status });
    }

    if (query?.priority && query.priority !== 'all') {
      qb.andWhere('task.priority = :priority', { priority: query.priority });
    }

    if (query?.assignee && query.assignee !== 'all') {
      qb.andWhere('LOWER(task.assigneeName) = LOWER(:assignee)', { assignee: query.assignee });
    }

    if (query?.meeting) {
      qb.andWhere('task.meetingId = :meetingId', { meetingId: query.meeting });
    }

    if (query?.dueDate) {
      qb.andWhere('task.dueDate = :dueDate', { dueDate: query.dueDate });
    }

    if (query?.overdue) {
      const today = new Date().toISOString().split('T')[0];
      qb.andWhere('task.status != :doneStatus AND task.dueDate < :today', {
        doneStatus: 'done',
        today,
      });
    }

    if (query?.search && query.search.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere('(LOWER(task.title) LIKE :term OR LOWER(task.notes) LIKE :term)', { term });
    }

    const tasks = await qb.getMany();
    return tasks.map((t) => this.formatTask(t));
  }

  async findOne(id: string): Promise<any> {
    const task = await this.taskRepo.findOne({
      where: { id },
      relations: ['meeting'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.formatTask(task);
  }

  async create(dto: CreateTaskDto): Promise<any> {
    const id = `task-${uuidv4()}`;
    const assigneeName =
      dto.assigneeName ||
      (dto.assignee && typeof dto.assignee === 'object' ? dto.assignee.name : null);

    let meetingId = dto.meetingId;
    if (!meetingId) {
      // Find latest meeting or create a default session placeholder
      const meetings = await this.meetingRepo.find({ order: { createdAt: 'DESC' }, take: 1 });
      meetingId = meetings.length > 0 ? meetings[0].id : `meet-${uuidv4()}`;
    }

    const task = this.taskRepo.create({
      id,
      meetingId,
      reportId: dto.reportId || null,
      title: dto.title.trim(),
      assigneeName: assigneeName || null,
      dueDate: dto.dueDate || new Date().toISOString().split('T')[0],
      priority: dto.priority || 'medium',
      status: dto.status || 'todo',
      notes: dto.notes || null,
      sourceExcerpt: dto.sourceExcerpt || null,
      needsReview: dto.needsReview || false,
    });

    const saved = await this.taskRepo.save(task);
    return this.formatTask(saved);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<any> {
    const task = await this.taskRepo.findOne({ where: { id }, relations: ['meeting'] });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (dto.title !== undefined) task.title = dto.title.trim();
    if (dto.assigneeName !== undefined) task.assigneeName = dto.assigneeName;
    if (dto.assignee && typeof dto.assignee === 'object' && dto.assignee.name) {
      task.assigneeName = dto.assignee.name;
    }
    if (dto.dueDate !== undefined) task.dueDate = dto.dueDate;
    if (dto.priority !== undefined) task.priority = dto.priority;
    if (dto.status !== undefined) {
      task.status = dto.status;
      task.completedAt = dto.status === 'done' ? new Date().toISOString().split('T')[0] : null;
    }
    if (dto.notes !== undefined) task.notes = dto.notes;
    if (dto.sourceExcerpt !== undefined) task.sourceExcerpt = dto.sourceExcerpt;
    if (dto.needsReview !== undefined) task.needsReview = dto.needsReview;

    const saved = await this.taskRepo.save(task);
    return this.formatTask(saved);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const task = await this.taskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    await this.taskRepo.remove(task);
    return { success: true };
  }

  formatTask(task: TaskEntity): any {
    const hasAssignee = Boolean(task.assigneeName && task.assigneeName !== 'Unassigned');
    const assignee = hasAssignee
      ? {
          id: `p-${encodeURIComponent(task.assigneeName!)}`,
          name: task.assigneeName!,
          email: `${task.assigneeName!.toLowerCase().replace(/\s+/g, '.')}@meettrack.ai`,
          role: 'Team Member',
          initials: task.assigneeName!.substring(0, 2).toUpperCase(),
          color: '#3B82F6',
        }
      : {
          id: 'unassigned',
          name: 'Unassigned',
          email: '',
          role: 'Unassigned',
          initials: 'UN',
          color: '#94A3B8',
        };

    return {
      id: task.id,
      title: task.title,
      meetingId: task.meetingId,
      meetingTitle: task.meeting ? task.meeting.title : undefined,
      reportId: task.reportId || undefined,
      assignee,
      dueDate:
        task.dueDate ||
        (task.createdAt
          ? new Date(task.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]),
      priority: task.priority,
      status: task.status,
      notes: task.notes || undefined,
      sourceExcerpt: task.sourceExcerpt || undefined,
      needsReview: task.needsReview,
      createdAt: task.createdAt
        ? new Date(task.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      completedAt: task.completedAt || undefined,
    };
  }
}
