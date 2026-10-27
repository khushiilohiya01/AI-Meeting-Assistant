import { TasksService } from './tasks.service';
import { TaskEntity } from '../database/entities/task.entity';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { Repository } from 'typeorm';

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepo: Partial<Repository<TaskEntity>>;
  let meetingRepo: Partial<Repository<MeetingEntity>>;

  beforeEach(() => {
    taskRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'task-test-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    meetingRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'meet-1',
        title: 'Design Review',
      } as MeetingEntity),
      find: jest.fn().mockResolvedValue([
        { id: 'meet-1', title: 'Design Review' } as MeetingEntity,
      ]),
    };

    tasksService = new TasksService(
      taskRepo as Repository<TaskEntity>,
      meetingRepo as Repository<MeetingEntity>,
    );
  });

  it('should create a task with nullable assignee and deadline without inventing fiction', async () => {
    const task = await tasksService.create({
      title: 'Review wireframe accessibility',
      priority: 'high',
      status: 'todo',
      assigneeName: undefined,
      dueDate: undefined,
      needsReview: true,
      notes: 'Extracted from team discussion',
    });

    expect(task).toBeDefined();
    expect(task.title).toBe('Review wireframe accessibility');
    expect(task.assignee.name).toBe('Unassigned');
    expect(task.needsReview).toBe(true);
    expect(taskRepo.save).toHaveBeenCalled();
  });

  it('should update task status and record completedAt when done', async () => {
    const existingTask = {
      id: 'task-1',
      title: 'Fix audio clipping',
      status: 'todo' as const,
      priority: 'medium' as const,
      completedAt: null,
      meeting: { id: 'meet-1', title: 'Sprint' },
    } as unknown as TaskEntity;

    taskRepo.findOne = jest.fn().mockResolvedValue(existingTask);

    const updated = await tasksService.update('task-1', {
      status: 'done',
    });

    expect(updated.status).toBe('done');
    expect(typeof existingTask.completedAt).toBe('string');
  });
});
