import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createTestUser, createTestTrip, createTestTripMember, cleanupTestData, prisma } from './test-utils';

describe('POST /api/trips', () => {
  let app: any;
  let testUser: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'trip-create@example.com' });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should create a new trip', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('x-user-id', testUser.id)
      .send({
        name: 'Summer Vacation',
        destination: 'Italy',
        startDate: '2026-07-01',
        endDate: '2026-07-14',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Summer Vacation');
  });

  it('should return 401 without user ID', async () => {
    const response = await request(app)
      .post('/api/trips')
      .send({
        name: 'Test Trip',
      });

    expect(response.status).toBe(401);
  });

  it('should validate input - empty name', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('x-user-id', testUser.id)
      .send({
        name: '',
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/trips/:id', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'trip-get@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Get Test Trip' });
    await createTestTripMember(testTrip.id, testUser.id, { role: 'MASTER', status: 'CONFIRMED' });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should get trip by ID', async () => {
    const response = await request(app)
      .get(`/api/trips/${testTrip.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testTrip.id);
    expect(response.body.name).toBe('Get Test Trip');
  });

  it('should return 404 for non-existent trip', async () => {
    const response = await request(app)
      .get('/api/trips/non-existent-id');

    expect(response.status).toBe(404);
  });
});

describe('POST /api/activities', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'activity-create@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Activity Test Trip' });
    await createTestTripMember(testTrip.id, testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should create a new activity', async () => {
    const response = await request(app)
      .post(`/api/trips/${testTrip.id}/activities`)
      .set('x-user-id', testUser.id)
      .send({
        title: 'Visit Colosseum',
        description: 'Tour the ancient amphitheater',
        cost: 50,
        category: 'excursion',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Visit Colosseum');
    expect(response.body.cost).toBe('50.0000');
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post(`/api/trips/${testTrip.id}/activities`)
      .set('x-user-id', testUser.id)
      .send({
        description: 'Missing title',
      });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/activities/:id/votes', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;
  let testActivity: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'vote-create@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Vote Test Trip' });
    await createTestTripMember(testTrip.id, testUser.id);
    testActivity = await createTestActivity(testTrip.id, testUser.id, { title: 'Vote Test Activity' });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should cast a vote', async () => {
    const response = await request(app)
      .post(`/api/activities/${testActivity.id}/votes`)
      .set('x-user-id', testUser.id)
      .send({
        option: 'yes',
      });

    expect(response.status).toBe(201);
    expect(response.body.option).toBe('yes');
  });

  it('should update existing vote', async () => {
    await request(app)
      .post(`/api/activities/${testActivity.id}/votes`)
      .set('x-user-id', testUser.id)
      .send({ option: 'yes' });

    const response = await request(app)
      .post(`/api/activities/${testActivity.id}/votes`)
      .set('x-user-id', testUser.id)
      .send({ option: 'no' });

    expect(response.status).toBe(201);
    expect(response.body.option).toBe('no');
  });

  it('should return 400 for invalid option', async () => {
    const response = await request(app)
      .post(`/api/activities/${testActivity.id}/votes`)
      .set('x-user-id', testUser.id)
      .send({ option: 'invalid' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/messages', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'message-create@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Message Test Trip' });
    await createTestTripMember(testTrip.id, testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should send a message', async () => {
    const response = await request(app)
      .post(`/api/messages/trip/${testTrip.id}`)
      .set('x-user-id', testUser.id)
      .send({
        content: 'Hello everyone!',
      });

    expect(response.status).toBe(201);
    expect(response.body.content).toBe('Hello everyone!');
  });

  it('should parse @mentions', async () => {
    const response = await request(app)
      .post(`/api/messages/trip/${testTrip.id}`)
      .set('x-user-id', testUser.id)
      .send({
        content: 'Hey @everyone!',
      });

    expect(response.status).toBe(201);
    expect(response.body.mentions).toHaveLength(1);
    expect(response.body.mentions[0].type).toBe('everyone');
  });

  it('should return 400 for empty content', async () => {
    const response = await request(app)
      .post(`/api/messages/trip/${testTrip.id}`)
      .set('x-user-id', testUser.id)
      .send({
        content: '',
      });

    expect(response.status).toBe(400);
  });
});

describe('GET /api/messages/trip/:tripId', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'message-get@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Message Get Test Trip' });
    await createTestTripMember(testTrip.id, testUser.id);
    
    await prisma.tripMessage.createMany({
      data: [
        { tripId: testTrip.id, userId: testUser.id, content: 'First message' },
        { tripId: testTrip.id, userId: testUser.id, content: 'Second message' },
        { tripId: testTrip.id, userId: testUser.id, content: 'Third message' },
      ],
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should get messages for trip', async () => {
    const response = await request(app)
      .get(`/api/messages/trip/${testTrip.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('should respect limit parameter', async () => {
    const response = await request(app)
      .get(`/api/messages/trip/${testTrip.id}?limit=2`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });
});

describe('Rate Limiting', () => {
  let app: any;
  let testUser: any;
  let testTrip: any;

  beforeAll(async () => {
    app = createTestApp();
    testUser = await createTestUser({ email: 'rate-limit@example.com' });
    testTrip = await createTestTrip(testUser.id, { name: 'Rate Limit Trip' });
    await createTestTripMember(testTrip.id, testUser.id);
  });

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  it('should include rate limit headers', async () => {
    const response = await request(app)
      .get(`/api/trips/${testTrip.id}`);

    expect(response.headers).toHaveProperty('x-ratelimit-limit');
    expect(response.headers).toHaveProperty('x-ratelimit-remaining');
  });
});
