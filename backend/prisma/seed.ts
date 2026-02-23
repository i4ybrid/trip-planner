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
        id: 'alice@example.com',
        email: 'alice@example.com',
        name: 'Alice Chen',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
        phone: '+1234567890',
        venmo: '@alicechen',
        paypal: 'alicechen',
        zelle: 'alice@example.com',
      },
    }),
    prisma.user.create({
      data: {
        id: 'bob@example.com',
        email: 'bob@example.com',
        name: 'Bob Johnson',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      },
    }),
    prisma.user.create({
      data: {
        id: 'carol@example.com',
        email: 'carol@example.com',
        name: 'Carol Williams',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      },
    }),
    prisma.user.create({
      data: {
        id: 'david@example.com',
        email: 'david@example.com',
        name: 'David Brown',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create trips with different states
  const trips = await Promise.all([
    // Trip 1: Planning state - test@user.com is MASTER
    prisma.trip.create({
      data: {
        id: 'trip-1',
        name: 'Paris Adventure 2026',
        description: 'Exploring the city of lights with friends',
        destination: 'Paris, France',
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-06-22'),
        status: 'PLANNING',
        tripMasterId: 'test@user.com',
        members: {
          create: [
            { userId: 'test@user.com', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'alice@example.com', role: 'MEMBER', status: 'CONFIRMED' },
            { userId: 'bob@example.com', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 2: Confirmed state - test@user.com is MEMBER
    prisma.trip.create({
      data: {
        id: 'trip-2',
        name: 'Summer Beach Trip',
        description: 'Relaxing at the beach',
        destination: 'Miami, Florida',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-07-07'),
        status: 'CONFIRMED',
        tripMasterId: 'alice@example.com',
        members: {
          create: [
            { userId: 'alice@example.com', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'test@user.com', role: 'MEMBER', status: 'CONFIRMED' },
            { userId: 'bob@example.com', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 3: Completed - test@user.com is MASTER
    prisma.trip.create({
      data: {
        id: 'trip-3',
        name: 'Tokyo Explorer',
        description: 'Exploring Japanese culture',
        destination: 'Tokyo, Japan',
        startDate: new Date('2025-12-20'),
        endDate: new Date('2025-12-30'),
        status: 'COMPLETED',
        tripMasterId: 'test@user.com',
        members: {
          create: [
            { userId: 'test@user.com', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'david@example.com', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
    // Trip 4: In Progress - test@user.com is MEMBER
    prisma.trip.create({
      data: {
        id: 'trip-4',
        name: 'Mountain Retreat',
        description: 'Weekend getaway to the mountains',
        destination: 'Denver, Colorado',
        startDate: new Date('2026-02-20'),
        endDate: new Date('2026-02-23'),
        status: 'IN_PROGRESS',
        tripMasterId: 'carol@example.com',
        members: {
          create: [
            { userId: 'carol@example.com', role: 'MASTER', status: 'CONFIRMED' },
            { userId: 'test@user.com', role: 'MEMBER', status: 'CONFIRMED' },
            { userId: 'bob@example.com', role: 'MEMBER', status: 'CONFIRMED' },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${trips.length} trips`);

  // Create activities with votes for trip-1 (test@user.com's trip)
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
        proposedBy: 'test@user.com',
        votes: {
          create: [
            { userId: 'test@user.com', option: 'yes' },
            { userId: 'alice@example.com', option: 'yes' },
            { userId: 'bob@example.com', option: 'no' },
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
        proposedBy: 'alice@example.com',
        votes: {
          create: [
            { userId: 'test@user.com', option: 'yes' },
            { userId: 'alice@example.com', option: 'yes' },
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
        proposedBy: 'bob@example.com',
        votes: {
          create: [
            { userId: 'test@user.com', option: 'maybe' },
          ],
        },
      },
    }),
  ]);

  console.log(`✅ Created ${activities.length} activities with votes`);

  // Create messages with @mentions for trip-1
  const messages = await Promise.all([
    prisma.tripMessage.create({
      data: {
        id: 'msg-1',
        tripId: 'trip-1',
        userId: 'test@user.com',
        content: 'Hey @everyone! Should we book the hotel soon?',
      },
    }),
    prisma.tripMessage.create({
      data: {
        id: 'msg-2',
        tripId: 'trip-1',
        userId: 'alice@example.com',
        content: 'Yes! @Carol what do you think about the Airbnb I shared?',
      },
    }),
    prisma.tripMessage.create({
      data: {
        id: 'msg-3',
        tripId: 'trip-1',
        userId: 'bob@example.com',
        content: "I think it's great! Let's go with it.",
      },
    }),
  ]);

  console.log(`✅ Created ${messages.length} messages`);

  // Create bookings for trips
  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        id: 'booking-1',
        tripId: 'trip-1',
        bookedBy: 'test@user.com',
        status: 'CONFIRMED',
        notes: 'Hotel: $500',
      },
    }),
    prisma.booking.create({
      data: {
        id: 'booking-2',
        tripId: 'trip-1',
        bookedBy: 'alice@example.com',
        status: 'CONFIRMED',
        notes: 'Flight: $400',
      },
    }),
    prisma.booking.create({
      data: {
        id: 'booking-3',
        tripId: 'trip-2',
        bookedBy: 'test@user.com',
        status: 'CONFIRMED',
        notes: 'Restaurant: $150',
      },
    }),
  ]);

  console.log(`✅ Created ${bookings.length} expenses`);

  // Create media items for trip-3 (Tokyo)
  const mediaItems = await Promise.all([
    prisma.mediaItem.create({
      data: {
        id: 'media-1',
        tripId: 'trip-3',
        uploaderId: 'test@user.com',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
        caption: 'Tokyo Tower at night',
      },
    }),
    prisma.mediaItem.create({
      data: {
        id: 'media-2',
        tripId: 'trip-3',
        uploaderId: 'david@example.com',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800',
        caption: 'Cherry blossoms',
      },
    }),
  ]);

  console.log(`✅ Created ${mediaItems.length} media items`);

  // Create notifications for test@user.com
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: 'test@user.com',
        tripId: 'trip-1',
        type: 'vote',
        title: 'New vote on Eiffel Tower',
        body: 'Bob voted no on your activity suggestion',
        actionUrl: '/trip/trip-1/activities',
      },
    }),
    prisma.notification.create({
      data: {
        userId: 'test@user.com',
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
