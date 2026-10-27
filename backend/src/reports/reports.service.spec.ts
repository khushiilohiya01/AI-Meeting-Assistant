import { ReportsService } from './reports.service';
import { MeetingReportEntity } from '../database/entities/meeting-report.entity';
import { MeetingEntity } from '../database/entities/meeting.entity';
import { TranscriptSegmentEntity } from '../database/entities/transcript-segment.entity';
import { ShareLinkEntity } from '../database/entities/share-link.entity';
import { TaskEntity } from '../database/entities/task.entity';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';

describe('ReportsService', () => {
  let reportsService: ReportsService;
  let reportRepo: Partial<Repository<MeetingReportEntity>>;
  let meetingRepo: Partial<Repository<MeetingEntity>>;
  let transcriptRepo: Partial<Repository<TranscriptSegmentEntity>>;
  let shareRepo: Partial<Repository<ShareLinkEntity>>;
  let taskRepo: Partial<Repository<TaskEntity>>;

  beforeEach(() => {
    reportRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue({
        id: 'rep-1',
        meetingId: 'meet-1',
        summary: 'Executive overview',
        topics: [{ title: 'Sync' }],
      } as unknown as MeetingReportEntity),
    };

    meetingRepo = {
      findOne: jest.fn().mockResolvedValue({
        id: 'meet-1',
        title: 'Strategy Session',
        status: 'processed',
      } as MeetingEntity),
    };

    transcriptRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'seg-1',
          sequenceNumber: 1,
          startOffsetSeconds: 0,
          endOffsetSeconds: 4,
          text: 'Hello team, welcome to our planning session.',
        } as TranscriptSegmentEntity,
      ]),
    };

    shareRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'share-1',
        createdAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
      findOne: jest.fn().mockResolvedValue(null),
    };

    taskRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    reportsService = new ReportsService(
      reportRepo as Repository<MeetingReportEntity>,
      meetingRepo as Repository<MeetingEntity>,
      transcriptRepo as Repository<TranscriptSegmentEntity>,
      shareRepo as Repository<ShareLinkEntity>,
      taskRepo as Repository<TaskEntity>,
    );
  });

  it('should generate an unguessable token and store only the SHA-256 hash', async () => {
    const result = await reportsService.createShareLink('rep-1', {
      includeTranscript: true,
      expiryHours: 24,
    });

    expect(result).toBeDefined();
    expect(result.publicToken).toBeDefined();
    expect(typeof result.publicToken).toBe('string');
    expect(result.publicToken.length).toBeGreaterThanOrEqual(32);

    const expectedHash = crypto
      .createHash('sha256')
      .update(result.publicToken)
      .digest('hex');

    expect(shareRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        reportId: 'rep-1',
        tokenHash: expectedHash,
        includeTranscript: true,
      }),
    );
  });

  it('should deny transcript access when meeting is active/capturing', async () => {
    meetingRepo.findOne = jest.fn().mockResolvedValue({
      id: 'meet-active',
      title: 'Active Session',
      status: 'capturing',
    } as MeetingEntity);

    await expect(
      reportsService.getTranscript('meet-active'),
    ).rejects.toThrow('Transcript is protected while meeting is actively capturing or finalizing');
  });

  it('should allow transcript access once meeting is processed', async () => {
    const segments = await reportsService.getTranscript('meet-1');
    expect(segments.length).toBe(1);
    expect(segments[0].text).toContain('Hello team');
  });
});
