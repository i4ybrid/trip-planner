import { getPrisma } from '@/lib/prisma';
import { getSocketIO } from '@/lib/socket';

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
    const event = await this.prisma.timelineEvent.create({
      data: {
        tripId: input.tripId,
        eventType: input.eventType,
        description: input.description,
        actorId: input.actorId,
        targetId: input.targetId,
        metadata: input.metadata ?? undefined,
      },
    });

    // Emit to connected clients in the trip room
    const io = getSocketIO();
    if (io) {
      io.to(`trip:${input.tripId}`).emit('timeline:event', event);
    }
  }
}

export const timelineService = new TimelineService();
