import { getPrisma } from '@/lib/prisma';

export interface EmitTimelineEventInput {
  tripId: string;
  eventType: string; // SCREAMING_SNAKE_CASE
  actorId?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  description: string;
}

export class TimelineService {
  private prisma = getPrisma();

  async emitTimelineEvent(input: EmitTimelineEventInput): Promise<void> {
    await this.prisma.timelineEvent.create({
      data: {
        tripId: input.tripId,
        eventType: input.eventType,
        description: input.description,
        actorId: input.actorId,
        targetId: input.targetId,
        metadata: input.metadata ?? undefined,
      },
    });
  }
}

export const timelineService = new TimelineService();
