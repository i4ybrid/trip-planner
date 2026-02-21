import { PrismaClient, MemberRole, MemberStatus } from '@prisma/client';

export const prisma = new PrismaClient();

export function createTestApp() {
  return {
    use: () => createTestApp(),
    get: () => createTestApp(),
    post: () => createTestApp(),
    put: () => createTestApp(),
    delete: () => createTestApp(),
  };
}

export async function createTestUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      ...overrides,
    },
  });
}

export async function createTestTrip(creatorId: string, overrides = {}) {
  return prisma.trip.create({
    data: {
      name: 'Test Trip',
      description: 'A test trip',
      destination: 'Test Location',
      status: 'PLANNING',
      tripMasterId: creatorId,
      ...overrides,
    },
  });
}

export async function createTestTripMember(tripId: string, userId: string, overrides: { role?: MemberRole; status?: MemberStatus } = {}) {
  return prisma.tripMember.create({
    data: {
      tripId,
      userId,
      role: overrides.role || 'MEMBER',
      status: overrides.status || 'INVITED',
    },
  });
}

export async function createTestActivity(tripId: string, proposerId: string, overrides = {}) {
  return prisma.activity.create({
    data: {
      tripId,
      proposedBy: proposerId,
      title: 'Test Activity',
      description: 'Test description',
      cost: 100,
      category: 'activity',
      ...overrides,
    },
  });
}

export async function createTestMessage(tripId: string, userId: string, overrides = {}) {
  return prisma.tripMessage.create({
    data: {
      tripId,
      userId,
      content: 'Test message',
      messageType: 'TEXT',
      ...overrides,
    },
  });
}

export async function cleanupTestData() {
  await prisma.messageReaction.deleteMany();
  await prisma.messageReadReceipt.deleteMany();
  await prisma.tripMessage.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();
}
