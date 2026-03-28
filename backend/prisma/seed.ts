import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Seed data based on frontend mock-api.ts
const SEED_USERS = [
  { id: 'user-1', email: 'test@example.com', name: 'Test User', password: 'password123' },
  { id: 'user-2', email: 'sarah@example.com', name: 'Sarah Chen', password: 'password123' },
  { id: 'user-3', email: 'mike@example.com', name: 'Mike Johnson', password: 'password123' },
  { id: 'user-4', email: 'emma@example.com', name: 'Emma Wilson', password: 'password123' },
];

const SEED_SETTINGS = {
  userId: 'user-1',
  friendRequestSource: 'ANYONE' as const,
  emailTripInvites: true,
  emailPaymentRequests: true,
  emailVotingReminders: true,
  emailTripReminders: true,
  emailMessages: true,
  pushTripInvites: true,
  pushPaymentRequests: true,
  pushVotingReminders: true,
  pushTripReminders: true,
  pushMessages: true,
  inAppAll: true,
};

const SEED_TRIPS = [
  {
    id: 'trip-1',
    name: 'Hawaii Beach Vacation',
    description: 'Week-long adventure in paradise!',
    destination: 'Maui, Hawaii',
    startDate: new Date('2026-06-15'),
    endDate: new Date('2026-06-22'),
    status: 'PLANNING' as const,
    tripMasterId: 'user-1',
    coverImage: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=800',
  },
  {
    id: 'trip-2',
    name: 'NYC Birthday Weekend',
    description: 'Celebrating Sarah\'s birthday in the city!',
    destination: 'New York City, NY',
    startDate: new Date('2026-04-18'),
    endDate: new Date('2026-04-20'),
    status: 'CONFIRMED' as const,
    tripMasterId: 'user-2',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
  },
  {
    id: 'trip-3',
    name: 'European Adventure',
    description: 'Exploring the best of Europe - Paris, Rome, Barcelona!',
    destination: 'Europe',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-14'),
    status: 'IDEA' as const,
    tripMasterId: 'user-1',
    coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
  },
  {
    id: 'trip-4',
    name: 'Ski Trip 2025',
    description: 'Epic ski weekend in the mountains!',
    destination: 'Aspen, Colorado',
    startDate: new Date('2025-12-20'),
    endDate: new Date('2025-12-23'),
    status: 'COMPLETED' as const,
    tripMasterId: 'user-3',
    coverImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
  },
  {
    id: 'trip-5',
    name: 'Nashville Trip',
    description: 'Trip in progress - adding photos and videos!',
    destination: 'Nashville, Tennessee',
    startDate: new Date('2026-02-18'),
    endDate: new Date('2026-02-22'),
    status: 'HAPPENING' as const,
    tripMasterId: 'user-2',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
  },
];

const SEED_MEMBERS = [
  { tripId: 'trip-1', userId: 'user-1', role: 'MASTER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-1', userId: 'user-2', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-1', userId: 'user-3', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-1', userId: 'user-4', role: 'MEMBER' as const, status: 'MAYBE' as const },
  { tripId: 'trip-2', userId: 'user-2', role: 'MASTER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-2', userId: 'user-1', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-3', userId: 'user-1', role: 'MASTER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-4', userId: 'user-3', role: 'MASTER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-4', userId: 'user-1', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-4', userId: 'user-2', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-5', userId: 'user-2', role: 'MASTER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-5', userId: 'user-1', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
  { tripId: 'trip-5', userId: 'user-4', role: 'MEMBER' as const, status: 'CONFIRMED' as const },
];

const SEED_ACTIVITIES = [
  { tripId: 'trip-1', title: 'Surfing Lessons', description: '2-hour beginner surf lesson at Waikiki Beach', location: 'Waikiki Beach', cost: 75, currency: 'USD', category: 'activity', proposedBy: 'user-1' },
  { tripId: 'trip-1', title: 'Road to Hana', description: 'Full day guided tour along the famous Road to Hana', location: 'Maui', cost: 150, currency: 'USD', category: 'excursion', proposedBy: 'user-2' },
  { tripId: 'trip-1', title: 'Luau Dinner', description: 'Traditional Hawaiian luau with dinner and show', location: 'Grand Wailea', cost: 120, currency: 'USD', category: 'restaurant', proposedBy: 'user-3' },
  { tripId: 'trip-1', title: 'Hotel: Grand Wailea', description: 'Luxury resort booking', location: 'Maui', cost: 450, currency: 'USD', category: 'accommodation', proposedBy: 'user-1' },
  { tripId: 'trip-2', title: 'Broadway Show', description: 'Hamilton on Broadway!', location: 'Broadway, NYC', cost: 200, currency: 'USD', category: 'activity', proposedBy: 'user-2' },
  { tripId: 'trip-2', title: 'Hotel: Manhattan Club', description: 'Manhattan boutique hotel', location: 'Manhattan', cost: 300, currency: 'USD', category: 'accommodation', proposedBy: 'user-1' },
  { tripId: 'trip-3', title: 'Eiffel Tower Visit', description: 'Skip-the-line tickets', location: 'Paris', cost: 50, currency: 'EUR', category: 'activity', proposedBy: 'user-1' },
  { tripId: 'trip-3', title: 'Colosseum Tour', description: 'Guided tour of the Colosseum', location: 'Rome', cost: 60, currency: 'EUR', category: 'excursion', proposedBy: 'user-1' },
];

const SEED_VOTES = [
  { activityId: 'act-1', userId: 'user-1', option: 'YES' as const },
  { activityId: 'act-1', userId: 'user-2', option: 'YES' as const },
  { activityId: 'act-1', userId: 'user-3', option: 'MAYBE' as const },
  { activityId: 'act-2', userId: 'user-1', option: 'YES' as const },
  { activityId: 'act-2', userId: 'user-2', option: 'YES' as const },
  { activityId: 'act-3', userId: 'user-1', option: 'YES' as const },
  { activityId: 'act-3', userId: 'user-2', option: 'NO' as const },
  { activityId: 'act-4', userId: 'user-1', option: 'YES' as const },
  { activityId: 'act-4', userId: 'user-2', option: 'YES' as const },
  { activityId: 'act-4', userId: 'user-3', option: 'YES' as const },
  { activityId: 'act-5', userId: 'user-1', option: 'YES' as const },
  { activityId: 'act-5', userId: 'user-2', option: 'YES' as const },
];

// Generate 50 messages for trip-1 to test pagination
const generateTripMessages = (): { tripId: string; senderId: string; content: string; messageType: 'TEXT'; createdAt: Date }[] => {
  const messages: { tripId: string; senderId: string; content: string; messageType: 'TEXT'; createdAt: Date }[] = [];
  const tripMessages = [
    { senderId: 'user-1', content: 'Hey everyone! Excited about this trip! 🏝️' },
    { senderId: 'user-2', content: 'Me too! I\'ve always wanted to go to Maui!' },
    { senderId: 'user-3', content: 'Has anyone looked at the surf lessons? I think that would be so fun!' },
    { senderId: 'user-1', content: 'I added it as an activity - please vote!' },
    { senderId: 'user-4', content: 'Just voted! Can\'t wait!' },
    { senderId: 'user-2', content: 'Should we rent a car or use Uber?' },
    { senderId: 'user-1', content: 'I think renting a car makes more sense for the Road to Hana' },
    { senderId: 'user-3', content: 'Agreed, plus we can explore at our own pace' },
    { senderId: 'user-4', content: 'I found a good deal on a convertible!' },
    { senderId: 'user-2', content: 'Nice! What\'s the daily rate?' },
    { senderId: 'user-4', content: 'About $80/day including insurance' },
    { senderId: 'user-1', content: 'That\'s pretty good for Maui' },
    { senderId: 'user-3', content: 'Should we split the car rental 4 ways?' },
    { senderId: 'user-2', content: 'Yeah that makes sense' },
    { senderId: 'user-1', content: 'I\'ll create a bill split for it' },
    { senderId: 'user-4', content: 'Has anyone been to the Grand Wailea before?' },
    { senderId: 'user-2', content: 'I heard the pools are amazing!' },
    { senderId: 'user-1', content: 'Yes! They have a water elevator between pools' },
    { senderId: 'user-3', content: 'That sounds incredible' },
    { senderId: 'user-4', content: 'I\'m booking the spa package' },
    { senderId: 'user-1', content: 'The luau is going to be on night 3' },
    { senderId: 'user-2', content: 'Perfect! I\'ll bring my camera' },
    { senderId: 'user-3', content: 'Don\'t forget sunscreen!' },
    { senderId: 'user-4', content: 'Already packed reef-safe sunscreen' },
    { senderId: 'user-1', content: 'Good call, Hawaii requires reef-safe now' },
    { senderId: 'user-2', content: 'What about hiking shoes?' },
    { senderId: 'user-3', content: 'I\'m bringing both sneakers and sandals' },
    { senderId: 'user-4', content: 'Same here' },
    { senderId: 'user-1', content: 'Anyone want to do the zipline activity?' },
    { senderId: 'user-2', content: 'That sounds scary but fun!' },
    { senderId: 'user-3', content: 'I\'m in if everyone else is' },
    { senderId: 'user-4', content: 'Let\'s add it to the activities list' },
    { senderId: 'user-1', content: 'Done! Go vote on it' },
    { senderId: 'user-2', content: 'Voted yes!' },
    { senderId: 'user-3', content: 'Yes from me too' },
    { senderId: 'user-4', content: 'This is going to be the best trip ever!' },
    { senderId: 'user-1', content: 'Flight prices are looking good btw' },
    { senderId: 'user-2', content: 'I set up price alerts, will let you know if they drop' },
    { senderId: 'user-3', content: 'Thanks Sarah!' },
    { senderId: 'user-4', content: 'Should we plan a group dinner the first night?' },
    { senderId: 'user-1', content: 'Great idea! There\'s a great seafood place near the hotel' },
    { senderId: 'user-2', content: 'I\'ll make a reservation' },
    { senderId: 'user-3', content: 'Anyone have dietary restrictions?' },
    { senderId: 'user-4', content: 'I\'m vegetarian but I eat fish' },
    { senderId: 'user-1', content: 'No restrictions here' },
    { senderId: 'user-2', content: 'Same, I\'ll find a place with good options' },
    { senderId: 'user-3', content: 'Can\'t wait to try the poke!' },
    { senderId: 'user-4', content: 'Poke is a must!' },
    { senderId: 'user-1', content: 'Alright team, 3 months to go! 🎉' },
    { senderId: 'user-2', content: 'Time flies! See you all in paradise!' },
  ];

  tripMessages.forEach((msg, index) => {
    messages.push({
      tripId: 'trip-1',
      senderId: msg.senderId,
      content: msg.content,
      messageType: 'TEXT' as const,
      createdAt: new Date(Date.now() - (tripMessages.length - index) * 3600000), // 1 hour apart
    });
  });

  return messages;
};

const SEED_MESSAGES = [
  ...generateTripMessages(),
  { tripId: 'trip-2', senderId: 'user-2', content: 'Birthday trip! Can\'t wait! 🎉', messageType: 'TEXT' as const },
  { tripId: 'trip-2', senderId: 'user-1', content: 'Going to book us tickets to Hamilton!', messageType: 'TEXT' as const },
];

const SEED_TIMELINE = [
  { tripId: 'trip-1', eventType: 'trip_created', description: 'Hawaii Beach Vacation was created', createdBy: 'user-1' },
  { tripId: 'trip-1', eventType: 'member_joined', description: 'Sarah Chen joined the trip', createdBy: 'user-2' },
  { tripId: 'trip-1', eventType: 'member_joined', description: 'Mike Johnson joined the trip', createdBy: 'user-3' },
  { tripId: 'trip-1', eventType: 'activity_added', description: 'Surfing Lessons proposed', createdBy: 'user-1' },
  { tripId: 'trip-1', eventType: 'vote_cast', description: 'Voted YES on Surfing Lessons', createdBy: 'user-1' },
  { tripId: 'trip-1', eventType: 'activity_added', description: 'Hotel: Grand Wailea proposed', createdBy: 'user-1' },
  { tripId: 'trip-1', eventType: 'vote_cast', description: 'Voted YES on Hotel: Grand Wailea', createdBy: 'user-2' },
  { tripId: 'trip-1', eventType: 'status_changed', description: 'Trip moved to PLANNING', createdBy: 'user-1' },
  { tripId: 'trip-5', eventType: 'trip_created', description: 'Nashville Trip was created', createdBy: 'user-2' },
  { tripId: 'trip-5', eventType: 'status_changed', description: 'Trip started!', createdBy: 'user-2' },
];

const SEED_BILL_SPLITS = [
  {
    tripId: 'trip-1',
    title: 'Hotel: Grand Wailea',
    description: 'Luxury resort for 7 nights',
    amount: 1800,
    currency: 'USD',
    splitType: 'EQUAL' as const,
    paidBy: 'user-1',
    createdBy: 'user-1',
    status: 'PENDING' as const,
    dueDate: new Date('2026-05-01'),
  },
  {
    tripId: 'trip-1',
    title: 'Luau Dinner',
    description: 'Traditional Hawaiian luau',
    amount: 360,
    currency: 'USD',
    splitType: 'EQUAL' as const,
    paidBy: 'user-3',
    createdBy: 'user-3',
    status: 'PAID' as const,
  },
];

const SEED_BILL_SPLIT_MEMBERS = [
  { billSplitId: 'bill-1', userId: 'user-1', dollarAmount: 450, type: 'EQUAL' as const, status: 'PAID' as const, paymentMethod: 'VENMO' as const },
  { billSplitId: 'bill-1', userId: 'user-2', dollarAmount: 450, type: 'EQUAL' as const, status: 'PENDING' as const },
  { billSplitId: 'bill-1', userId: 'user-3', dollarAmount: 450, type: 'EQUAL' as const, status: 'PAID' as const, paymentMethod: 'VENMO' as const },
  { billSplitId: 'bill-1', userId: 'user-4', dollarAmount: 450, type: 'EQUAL' as const, status: 'PENDING' as const },
  { billSplitId: 'bill-2', userId: 'user-1', dollarAmount: 90, type: 'EQUAL' as const, status: 'PAID' as const, paymentMethod: 'CASH' as const },
  { billSplitId: 'bill-2', userId: 'user-2', dollarAmount: 90, type: 'EQUAL' as const, status: 'PAID' as const, paymentMethod: 'CASH' as const },
  { billSplitId: 'bill-2', userId: 'user-3', dollarAmount: 90, type: 'EQUAL' as const, status: 'PAID' as const, paymentMethod: 'CASH' as const },
  { billSplitId: 'bill-2', userId: 'user-4', dollarAmount: 90, type: 'EQUAL' as const, status: 'PENDING' as const },
];

const SEED_FRIENDS = [
  { userId: 'user-1', friendId: 'user-2' },
  { userId: 'user-1', friendId: 'user-3' },
  { userId: 'user-2', friendId: 'user-1' },
  { userId: 'user-3', friendId: 'user-1' },
];

const SEED_FRIEND_REQUESTS = [
  { senderId: 'user-4', receiverId: 'user-1', status: 'PENDING' as const },
];

const SEED_NOTIFICATIONS = [
  { userId: 'user-1', category: 'MILESTONE' as const, title: 'Trip coming up!', body: 'Hawaii Beach Vacation starts in 2 weeks', referenceId: 'trip-1', referenceType: 'TRIP' as const, link: '/trip/trip-1' },
  { userId: 'user-1', category: 'MEMBER' as const, title: 'Vote needed', body: 'Vote on Surfing Lessons activity for Hawaii trip', referenceId: 'trip-1', referenceType: 'TRIP' as const, link: '/trip/trip-1' },
  { userId: 'user-1', category: 'SETTLEMENT' as const, title: 'Payment needed', body: 'You owe $120 for Luau Dinner - please pay Sarah', referenceId: 'trip-1', referenceType: 'BILL_SPLIT' as const, link: '/trip/trip-1/payments' },
  { userId: 'user-1', category: 'CHAT' as const, title: 'Tagged in chat', body: 'Sarah mentioned you in the Nashville trip chat', referenceId: 'trip-5', referenceType: 'TRIP' as const, link: '/trip/trip-5/chat' },
];

const SEED_MEDIA = [
  { tripId: 'trip-5', uploaderId: 'user-2', type: 'image' as const, url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', caption: 'Nashville skyline at night' },
  { tripId: 'trip-5', uploaderId: 'user-2', type: 'image' as const, url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', caption: 'Broadway neon lights' },
  { tripId: 'trip-5', uploaderId: 'user-1', type: 'image' as const, url: 'https://images.unsplash.com/photo-1544542900-1af4c07e98d8?w=800', caption: 'Guitar shop on Broadway' },
];

const SEED_DM_CONVERSATIONS = [
  { participant1: 'user-1', participant2: 'user-2' },
  { participant1: 'user-1', participant2: 'user-3' },
];

const SEED_DM_MESSAGES = [
  { conversationId: 'dm-1', senderId: 'user-1', content: 'Hey! Can\'t wait for the trip!', messageType: 'TEXT' as const },
  { conversationId: 'dm-1', senderId: 'user-2', content: 'Me neither! Already packed my bags!', messageType: 'TEXT' as const },
];

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...');
  await prisma.timelineEvent.deleteMany();
  await prisma.messageReadReceipt.deleteMany();
  await prisma.message.deleteMany();
  await prisma.billSplitMember.deleteMany();
  await prisma.billSplit.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.inviteChannel.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.friend.deleteMany();
  await prisma.friendRequest.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.mediaItem.deleteMany();
  await prisma.dmConversation.deleteMany();
  await prisma.settings.deleteMany();
  await prisma.user.deleteMany();

  // Create users with hashed passwords
  console.log('👥 Creating users...');
  for (const userData of SEED_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 10);
    await prisma.user.create({
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        passwordHash,
      },
    });
  }

  // Create settings for user-1
  console.log('⚙️  Creating settings...');
  await prisma.settings.create({
    data: SEED_SETTINGS,
  });

  // Create trips
  console.log('🏝️  Creating trips...');
  for (const tripData of SEED_TRIPS) {
    await prisma.trip.create({
      data: tripData,
    });
  }

  // Create trip members
  console.log('👥 Creating trip members...');
  for (const memberData of SEED_MEMBERS) {
    await prisma.tripMember.create({
      data: {
        ...memberData,
        joinedAt: new Date(),
      },
    });
  }

  // Create activities (need to track IDs for votes)
  console.log('📅 Creating activities...');
  const activityIdMap = new Map<string, string>();
  let activityIndex = 1;
  for (const activityData of SEED_ACTIVITIES) {
    const activityId = `act-${activityIndex++}`;
    const activity = await prisma.activity.create({
      data: {
        ...activityData,
        id: activityId,
      },
    });
    activityIdMap.set(`act-${activityIndex - 1}`, activity.id);
  }

  // Create votes
  console.log('🗳️  Creating votes...');
  for (const voteData of SEED_VOTES) {
    await prisma.vote.create({
      data: voteData,
    });
  }

  // Create messages
  console.log('💬 Creating messages...');
  for (const messageData of SEED_MESSAGES) {
    await prisma.message.create({
      data: messageData,
    });
  }

  // Create timeline events
  console.log('📜 Creating timeline events...');
  for (const eventData of SEED_TIMELINE) {
    await prisma.timelineEvent.create({
      data: eventData,
    });
  }

  // Create bill splits (need to track IDs for members)
  console.log('💰 Creating bill splits...');
  const billSplitIdMap = new Map<string, string>();
  let billIndex = 1;
  for (const billData of SEED_BILL_SPLITS) {
    const billId = `bill-${billIndex++}`;
    const bill = await prisma.billSplit.create({
      data: {
        ...billData,
        id: billId,
      },
    });
    billSplitIdMap.set(`bill-${billIndex - 1}`, bill.id);
  }

  // Create bill split members
  console.log('🧾 Creating bill split members...');
  const billSplitMemberData = [
    { ...SEED_BILL_SPLIT_MEMBERS[0], billSplitId: billSplitIdMap.get('bill-1')! },
    { ...SEED_BILL_SPLIT_MEMBERS[1], billSplitId: billSplitIdMap.get('bill-1')! },
    { ...SEED_BILL_SPLIT_MEMBERS[2], billSplitId: billSplitIdMap.get('bill-1')! },
    { ...SEED_BILL_SPLIT_MEMBERS[3], billSplitId: billSplitIdMap.get('bill-1')! },
    { ...SEED_BILL_SPLIT_MEMBERS[4], billSplitId: billSplitIdMap.get('bill-2')! },
    { ...SEED_BILL_SPLIT_MEMBERS[5], billSplitId: billSplitIdMap.get('bill-2')! },
    { ...SEED_BILL_SPLIT_MEMBERS[6], billSplitId: billSplitIdMap.get('bill-2')! },
    { ...SEED_BILL_SPLIT_MEMBERS[7], billSplitId: billSplitIdMap.get('bill-2')! },
  ];

  for (const memberData of billSplitMemberData) {
    await prisma.billSplitMember.create({
      data: memberData,
    });
  }

  // Create friends
  console.log('🤝 Creating friends...');
  for (const friendData of SEED_FRIENDS) {
    await prisma.friend.create({
      data: friendData,
    });
  }

  // Create friend requests
  console.log('📨 Creating friend requests...');
  for (const requestData of SEED_FRIEND_REQUESTS) {
    await prisma.friendRequest.create({
      data: requestData,
    });
  }

  // Create notifications
  console.log('🔔 Creating notifications...');
  for (const notifData of SEED_NOTIFICATIONS) {
    await prisma.notification.create({
      data: notifData,
    });
  }

  // Create media items
  console.log('📸 Creating media items...');
  for (const mediaData of SEED_MEDIA) {
    await prisma.mediaItem.create({
      data: mediaData,
    });
  }

  // Create DM conversations
  console.log('💭 Creating DM conversations...');
  const dmConversationIdMap = new Map<string, string>();
  for (const dmData of SEED_DM_CONVERSATIONS) {
    const [p1, p2] = [dmData.participant1, dmData.participant2].sort();
    const conversation = await prisma.dmConversation.create({
      data: {
        participant1: p1,
        participant2: p2,
        id: `dm-${dmConversationIdMap.size + 1}`,
        participants: {
          connect: [
            { id: p1 },
            { id: p2 },
          ],
        },
      },
    });
    dmConversationIdMap.set(`dm-${dmConversationIdMap.size + 1}`, conversation.id);
  }

  // Create DM messages
  console.log('💬 Creating DM messages...');
  const dmMessageData = [
    { ...SEED_DM_MESSAGES[0], conversationId: dmConversationIdMap.get('dm-1')! },
    { ...SEED_DM_MESSAGES[1], conversationId: dmConversationIdMap.get('dm-1')! },
  ];

  for (const messageData of dmMessageData) {
    await prisma.message.create({
      data: messageData,
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📊 Seed Summary:');
  console.log(`   - ${SEED_USERS.length} users (password: password123)`);
  console.log(`   - ${SEED_TRIPS.length} trips`);
  console.log(`   - ${SEED_MEMBERS.length} trip members`);
  console.log(`   - ${SEED_ACTIVITIES.length} activities`);
  console.log(`   - ${SEED_VOTES.length} votes`);
  console.log(`   - ${SEED_MESSAGES.length} trip messages (${SEED_MESSAGES.length - 2} for trip-1, 2 for trip-2)`);
  console.log(`   - ${SEED_TIMELINE.length} timeline events`);
  console.log(`   - ${SEED_BILL_SPLITS.length} bill splits`);
  console.log(`   - ${SEED_BILL_SPLIT_MEMBERS.length} bill split members`);
  console.log(`   - ${SEED_FRIENDS.length} friendships`);
  console.log(`   - ${SEED_FRIEND_REQUESTS.length} friend requests`);
  console.log(`   - ${SEED_NOTIFICATIONS.length} notifications`);
  console.log(`   - ${SEED_MEDIA.length} media items`);
  console.log(`   - ${SEED_DM_CONVERSATIONS.length} DM conversations`);
  console.log(`   - ${SEED_DM_MESSAGES.length} DM messages`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
