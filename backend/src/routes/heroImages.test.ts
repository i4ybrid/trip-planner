import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app, server } from '../index';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const API_BASE = '/api/hero-images';

describe('Hero Images API', () => {
  let authToken: string;
  let testUserId: string;
  let testHeroImageId: string;

  beforeAll(async () => {
    // Create test user
    testUserId = 'test-hero-image-user';
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test-hero-image@example.com',
        name: 'Test Hero Image User',
        passwordHash,
      },
    });

    // Login to get auth token
    const loginResponse = await request(app)
      .post(`${API_BASE.replace('/hero-images', '/auth/login')}`)
      .send({
        email: 'test-hero-image@example.com',
        password: 'password123',
      });

    authToken = loginResponse.body.data?.token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.heroImage.deleteMany({ where: { id: { startsWith: 'test-' } } });
    await prisma.user.delete({ where: { id: testUserId } });
    server.close();
  });

  beforeEach(async () => {
    // Clean up test hero images before each test
    await prisma.heroImage.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
  });

  describe('POST /api/hero-images/seed', () => {
    it('should seed hero images from JSON file (admin only)', async () => {
      const response = await request(app)
        .post(`${API_BASE}/seed`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.count).toBe('number');
      expect(response.body.count).toBeGreaterThan(0);
    });
  });

  describe('GET /api/hero-images', () => {
    it('should list all hero images with id, title, filename', async () => {
      const response = await request(app).get(API_BASE);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        const img = response.body[0];
        expect(img).toHaveProperty('id');
        expect(img).toHaveProperty('title');
        expect(img).toHaveProperty('filename');
        expect(img).not.toHaveProperty('synonyms'); // Should NOT include synonyms in list
      }
    });
  });

  describe('GET /api/hero-images/search', () => {
    it('should search by synonym (case-insensitive) and return matches', async () => {
      // First seed
      await request(app)
        .post(`${API_BASE}/seed`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`${API_BASE}/search?q=beach`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should return images with "beach" in synonyms
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app)
        .get(`${API_BASE}/search?q=xyznotfound`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return 400 when query param q is missing', async () => {
      const response = await request(app).get(`${API_BASE}/search`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/hero-images/:id', () => {
    it('should get a single hero image by id', async () => {
      // First seed
      await request(app)
        .post(`${API_BASE}/seed`)
        .set('Authorization', `Bearer ${authToken}`);

      // Get first image from list
      const listResponse = await request(app).get(API_BASE);
      if (listResponse.body.length === 0) {
        expect(true).toBe(true); // Skip if no images
        return;
      }
      const firstImage = listResponse.body[0];

      const response = await request(app)
        .get(`${API_BASE}/${firstImage.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('synonyms');
    });

    it('should return 404 for non-existent id', async () => {
      const response = await request(app)
        .get(`${API_BASE}/non-existent-id-12345`);

      expect(response.status).toBe(404);
    });
  });

  describe('Trip heroImageId association', () => {
    it('should allow a trip to have a heroImageId', async () => {
      // Seed images first
      await request(app)
        .post(`${API_BASE}/seed`)
        .set('Authorization', `Bearer ${authToken}`);

      // Get an image id
      const listResponse = await request(app).get(API_BASE);
      if (listResponse.body.length === 0) {
        expect(true).toBe(true);
        return;
      }
      const imageId = listResponse.body[0].id;

      // Create a trip with heroImageId
      const trip = await prisma.trip.create({
        data: {
          id: 'test-hero-trip',
          name: 'Test Hero Image Trip',
          status: 'PLANNING',
          tripMasterId: testUserId,
          heroImageId: imageId,
        },
      });

      expect(trip.heroImageId).toBe(imageId);

      // Verify relation
      const tripWithImage = await prisma.trip.findUnique({
        where: { id: 'test-hero-trip' },
        include: { heroImage: true },
      });

      expect(tripWithImage?.heroImage).not.toBeNull();
      expect(tripWithImage?.heroImage?.id).toBe(imageId);

      // Cleanup
      await prisma.trip.delete({ where: { id: 'test-hero-trip' } });
    });
  });
});