import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.tripMessage.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.inviteChannel.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleaned existing data');

  // Create test user (for testing: test@user.com / password)
  const adminUser = await prisma.user.create({
    data: {
      id: 'test@user.com',
      email: 'test@user.com',
      name: 'Test User',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });
  console.log('✅ Created test user (test@user.com / password)');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: 'user-1',
        email: 'john@example.com',
        name: 'John Doe',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        phone: '+1234567890',
        venmo: '@johndoe',
        paypal: 'johndoe',
        zelle: 'john@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-2',
        email: 'jane@example.com',
        name: 'Jane Smith',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-3',
        email: 'bob@example.com',
        name: 'Bob Wilson',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      },
    }),
    prisma.user.create({
      data: {
        id: 'user-4',
        email: 'alice@example.com',
        name: 'Alice Johnson',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create trips with different states
  const trips = await Promise.all([
    // Trip 1: Planning state
    prisma.trip.create({
      data: {
        id: 'trip-1',
        name: 'Paris Adventure 2026',
        description: 'Exploring the city of lights with friends',
        destination: 'Paris, France',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-22'),
        status: 'PLANNING',
        tripMasterId: 'user-1',
        members: {
          create: [
            { userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED' },
            { userId: 'user-3', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 2: Confirmed state
    prisma.trip.create({
      data: {
        id: 'trip-2',
        name: 'Summer Beach Trip',
        description: 'Relaxing at the beach',
        destination: 'Miami, Florida',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-07'),
        status: 'CONFIRMED',
        tripMasterId: 'user-2',
        members: {
          create: [
            { userId: 'user-2', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 3: Completed
    prisma.trip.create({
      data: {
        id: 'trip-3',
        name: 'Tokyo Explorer',
        description: 'Exploring Japanese culture',
        destination: 'Tokyo, Japan',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-30'),
        status: 'COMPLETED',
        tripMasterId: 'user-1',
        members: {
          create: [
            { userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'user-4', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 4: In Progress
    prisma.trip.create({
      data: {
        id: 'trip-4',
        name: 'Mountain Retreat',
        description: 'Weekend getaway to the mountains',
        destination: 'Denver, Colorado',
        startDate: new Date('2026-02-20'),
        endDate: new Date('2026-02-23'),
        status: 'IN_PROGRESS',
        tripMasterId: 'user-3',
        members: {
          create: [
            { userId: 'user-3', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${trips.length} trips`);

  // Create activities with votes for trip-1
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        id: 'activity-1',
        tripId: 'trip-1',
        title: 'Visit Eiffel Tower',
        description: 'Morning visit to the iconic landmark',
        location: 'Eiffel Tower, Paris',
        cost: 25,
        category: 'attraction',
        proposedBy: 'user-1',
        votes: {
          create: [
            { userId: 'user-1', option: 'yes' },
            { userId: 'user-2', option: 'yes' },
            { userId: 'user-3', option: 'no' },
          ],
        },
      },
    }),
    prisma.activity.create({
      data: {
        id: 'activity-2',
        tripId: 'trip-1',
        title: 'Louvre Museum Tour',
        description: 'Full day exploring art',
        location: 'Louvre Museum',
        cost: 20,
        category: 'attraction',
        proposedBy: 'user-2',
        votes: {
          create: [
            { userId: 'user-1', option: 'yes' },
            { userId: 'user-2', option: 'yes' },
          ],
        },
      },
    }),
    prisma.activity.create({
      data: {
        id: 'activity-3',
        tripId: 'trip-1',
        title: 'Seine River Cruise',
        description: 'Evening dinner cruise',
        location: 'Seine River',
        cost: 80,
        category: 'activity',
        proposedBy: 'user-3',
        votes: {
          create: [
            { userId: 'user-1', option: 'maybe' },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${activities.length} activities with votes`);

  // Create messages with @mentions
  const messages = await Promise.all([
    prisma.tripMessage.create({
      data: {
        id: 'msg-1',
        tripId: 'trip-1',
        userId: 'user-1',
        content: 'Hey @everyone! Should we book the hotel soon?',
      },
    }),
    prisma.tripMessage.create({
      data: {
        id: 'msg-2',
        tripId: 'trip-1',
        userId: 'user-2',
        content: 'Yes! @Jane what do you think about the Airbnb I shared?',
      },
    }),
    prisma.tripMessage.create({
      data: {
        id: 'msg-3',
        tripId: 'trip-1',
        userId: 'user-3',
        content: "I think it's great! Let's go with it.",
      },
    }),
  ]);

  console.log(`✅ Created ${messages.length} messages`);

  // Create expenses with different split types
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        id: 'booking-1',
        tripId: 'trip-1',
        bookedBy: 'user-1',
        status: 'CONFIRMED',
        notes: 'Hotel: $500',
      },
    }),
    prisma.booking.create({
      data: {
        id: 'booking-2',
        tripId: 'trip-1',
        bookedBy: 'user-2',
        status: 'CONFIRMED',
        notes: 'Flight: $400',
      },
    }),
    prisma.booking.create({
      data: {
        id: 'booking-3',
        tripId: 'trip-2',
        bookedBy: 'user-2',
        status: 'CONFIRMED',
        notes: 'Restaurant: $150',
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} expenses`);

  // Create media items
  const mediaItems = await Promise.all([
    prisma.mediaItem.create({
      data: {
        id: 'media-1',
        tripId: 'trip-3',
        uploaderId: 'user-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        caption: 'Tokyo Tower at night',
      },
    }),
    prisma.mediaItem.create({
      data: {
        id: 'media-2',
        tripId: 'trip-3',
        uploaderId: 'user-4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
        caption: 'Cherry blossoms',
      },
    }),
  ]);

  console.log(`✅ Created ${mediaItems.length} media items`);

  // Create notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'vote',
        title: 'New vote on Eiffel Tower',
        body: 'Bob voted on your activity suggestion',
        actionUrl: '/trip/trip-1/activities',
      },
    }),
    prisma.notification.create({
      data: {
        userId: 'user-1',
        tripId: 'trip-2',
        type: 'reminder',
        title: 'Trip starts soon!',
        body: 'Your beach trip starts in 2 weeks',
        actionUrl: '/trip/trip-2',
      },
    }),
  ]);

  console.log(`✅ Created ${notifications.length} notifications`);

  console.log('🎉 Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
