import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { milestoneService } from './src/services/milestone.service';

const TEST_TRIP_ID = 'trip-2';
const TEST_TRIP_MASTER_ID = 'user-2';

async function cleanup() {
  await prisma.timelineEvent.deleteMany({ where: { tripId: TEST_TRIP_ID } });
  await prisma.milestone.deleteMany({ where: { tripId: TEST_TRIP_ID } });
  await prisma.tripTimelineUIState.deleteMany({ where: { tripId: TEST_TRIP_ID } });
  console.log('[cleanup] Removed test data for', TEST_TRIP_ID);
}

const prisma = new PrismaClient();

async function main() {
  try {
    await cleanup();

    // Get trip info
    const trip = await prisma.trip.findUnique({ where: { id: TEST_TRIP_ID } });
    if (!trip) { console.error('Trip not found'); process.exit(1); }
    console.log('[trip]', JSON.stringify({ id: trip.id, name: trip.name, tripMasterId: trip.tripMasterId }));

    // Call generateDefaultMilestonesFromToday
    const milestones = await milestoneService.generateDefaultMilestonesFromToday(
      trip.id,
      trip.startDate,
      trip.endDate
    );
    console.log('[milestones] created:', milestones.length, '| types:', milestones.map(m => m.type));

    // Check TimelineEvents
    const events = await prisma.timelineEvent.findMany({
      where: { tripId: TEST_TRIP_ID, kind: 'MILESTONE' },
      orderBy: { effectiveDate: 'asc' },
    });
    console.log('[timeline] MILESTONE events:', events.length);
    for (const e of events) {
      console.log('  kind=' + e.kind + ' | actorId=' + e.actorId + ' | title=' + e.title);
    }

    // Verify actorId
    const actorIdOk = events.every(e => e.actorId === TEST_TRIP_MASTER_ID);
    console.log('[check] All actorId ===', TEST_TRIP_MASTER_ID + ':', actorIdOk);

    // Check TripTimelineUIState
    const uiState = await prisma.tripTimelineUIState.findUnique({ where: { tripId: TEST_TRIP_ID } });
    console.log('[uiState] needsRefresh:', uiState?.needsRefresh);

    // Result
    const passed = events.length === 5 && actorIdOk && uiState?.needsRefresh === 'TRUE';
    console.log('\n=== RESULT:', passed ? 'PASSED ✓' : 'FAILED ✗', '===');

    // Cleanup
    await cleanup();
    console.log('[cleanup] Post-test cleanup done');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
