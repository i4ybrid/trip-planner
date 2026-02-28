import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storageConfig } from '../lib/storage';
import { logger } from '../lib/logger';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    logger.trace('[upload] Saving file:', file.originalname);
    logger.trace('[upload] Destination directory:', storageConfig.uploadDir);
    cb(null, storageConfig.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    const newFilename = `${uniqueId}${ext}`;
    logger.trace('[upload] New filename:', newFilename);
    cb(null, newFilename);
  },
});

// File filter - only allow images and videos
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  logger.trace('[upload] File filter - mimetype:', file.mimetype);
  const allowedMimeTypes = ['image/', 'video/'];

  if (allowedMimeTypes.some(type => file.mimetype.startsWith(type))) {
    logger.trace('[upload] File accepted');
    cb(null, true);
  } else {
    logger.trace('[upload] File rejected - invalid mimetype');
    cb(new Error('Only image and video files are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});
