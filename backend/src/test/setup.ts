import { vi } from 'viest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('socket.io', () => ({
  Server: vi.fn().mockImplementation(() => ({
    to: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    on: vi.fn(),
    use: vi.fn(),
  })),
}));

vi.mock('@sendgrid/mail', () => ({
  setApiKey: vi.fn(),
  send: vi.fn().mockResolvedValue([{ statusCode: 202 }]),
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn(),
  GetObjectCommand: vi.fn(),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed-url.test'),
}));

global.fetch = vi.fn();
