"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const storage_1 = require("../lib/storage");
const logger_1 = require("../lib/logger");
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (_req, file, cb) => {
        logger_1.logger.trace('[upload] Saving file:', file.originalname);
        logger_1.logger.trace('[upload] Destination directory:', storage_1.storageConfig.uploadDir);
        cb(null, storage_1.storageConfig.uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueId = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        const newFilename = `${uniqueId}${ext}`;
        logger_1.logger.trace('[upload] New filename:', newFilename);
        cb(null, newFilename);
    },
});
// File filter - only allow images and videos
const fileFilter = (_req, file, cb) => {
    logger_1.logger.trace('[upload] File filter - mimetype:', file.mimetype);
    const allowedMimeTypes = ['image/', 'video/'];
    if (allowedMimeTypes.some(type => file.mimetype.startsWith(type))) {
        logger_1.logger.trace('[upload] File accepted');
        cb(null, true);
    }
    else {
        logger_1.logger.trace('[upload] File rejected - invalid mimetype');
        cb(new Error('Only image and video files are allowed'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
    },
});
//# sourceMappingURL=upload.js.map