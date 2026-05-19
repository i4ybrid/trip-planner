"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageConfig = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("./logger");
/**
 * Media storage configuration
 *
 * MEDIA_STORAGE_URL environment variable controls where files are stored:
 * - Empty/undefined: Uses local ./uploads directory
 * - Local path (e.g., "/app/uploads"): Uses specified local directory
 * - Remote URL (e.g., "https://cdn.example.com/uploads"): Files stored locally but served from remote URL
 */
// Get storage configuration from environment
const mediaStorageUrl = process.env.MEDIA_STORAGE_URL || '';
// Determine if we're using a remote URL or local path
const isRemoteUrl = mediaStorageUrl.startsWith('http://') || mediaStorageUrl.startsWith('https://');
/**
 * Get the backend root directory
 * Works in both development (tsx) and production (compiled)
 */
function getBackendRoot() {
    // In production (compiled), __dirname points to dist/src
    // In development (tsx), we need to find the backend folder
    const possiblePaths = [
        // Compiled: dist/src -> backend
        path_1.default.resolve(__dirname, '../../'),
        // tsx from backend folder: cwd -> backend
        process.cwd(),
        // Fallback: check if we're in backend/src
        path_1.default.resolve(process.cwd(), '..'),
    ];
    for (const p of possiblePaths) {
        // Check if this looks like the backend root (has package.json and src folder)
        if (fs_1.default.existsSync(path_1.default.join(p, 'package.json')) && fs_1.default.existsSync(path_1.default.join(p, 'src'))) {
            logger_1.logger.trace('[storage] Found backend root at:', p);
            return p;
        }
    }
    // Last resort: use cwd
    logger_1.logger.trace('[storage] Using cwd as backend root:', process.cwd());
    return process.cwd();
}
const backendRoot = getBackendRoot();
// For local storage, resolve to absolute path
const localUploadsDir = isRemoteUrl
    ? path_1.default.resolve(backendRoot, 'uploads')
    : mediaStorageUrl
        ? path_1.default.resolve(mediaStorageUrl)
        : path_1.default.resolve(backendRoot, 'uploads');
// Base URL for serving files
const mediaBaseUrl = isRemoteUrl
    ? mediaStorageUrl.replace(/\/$/, '') // Remove trailing slash
    : '/uploads';
// Ensure uploads directory exists
if (!isRemoteUrl && !fs_1.default.existsSync(localUploadsDir)) {
    fs_1.default.mkdirSync(localUploadsDir, { recursive: true });
    logger_1.logger.info('[storage] Created uploads directory:', localUploadsDir);
}
// Debug logging
logger_1.logger.trace('[storage] Configuration:');
logger_1.logger.trace('[storage]   backendRoot:', backendRoot);
logger_1.logger.trace('[storage]   mediaStorageUrl:', mediaStorageUrl || '(empty - using local)');
logger_1.logger.trace('[storage]   isRemoteUrl:', isRemoteUrl);
logger_1.logger.trace('[storage]   localUploadsDir:', localUploadsDir);
logger_1.logger.trace('[storage]   mediaBaseUrl:', mediaBaseUrl);
logger_1.logger.trace('[storage]   uploadsDir exists:', fs_1.default.existsSync(localUploadsDir));
logger_1.logger.trace('[storage]   uploadsDir writable:', fs_1.default.existsSync(localUploadsDir) ? fs_1.default.existsSync(localUploadsDir) && fs_1.default.accessSync(localUploadsDir, fs_1.default.constants.W_OK) || true : false);
/**
 * Extract filename from URL
 * For local: /uploads/filename.jpg -> filename.jpg
 * For remote: https://cdn.com/uploads/filename.jpg -> filename.jpg
 */
function extractFilename(url) {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        return path_1.default.basename(pathname);
    }
    catch {
        // If URL parsing fails, try simple basename
        return path_1.default.basename(url);
    }
}
exports.storageConfig = {
    /** Absolute path to local uploads directory */
    uploadDir: localUploadsDir,
    /** Base URL for accessing files (either /uploads or remote CDN URL) */
    baseUrl: mediaBaseUrl,
    /** Whether files are served from a remote URL */
    isRemote: isRemoteUrl,
    /** Get full URL for a file */
    getFileUrl: (filename) => {
        if (isRemoteUrl) {
            return `${mediaBaseUrl}/${filename}`;
        }
        // For local files, the frontend will construct the URL from the backend host
        return `/uploads/${filename}`;
    },
    /**
     * Delete a file from storage
     * @param url - The full URL or path of the file to delete
     * @returns Promise resolving to true if deleted, false if file didn't exist
     */
    deleteFile: async (url) => {
        if (isRemoteUrl) {
            // For remote storage, delete from local uploads directory
            // (In production, you would sync with S3/CDN here)
            logger_1.logger.trace('[storage] Remote storage - would delete from CDN:', url);
            // Fall through to delete local copy
        }
        const filename = extractFilename(url);
        const filePath = path_1.default.join(localUploadsDir, filename);
        logger_1.logger.trace('[storage] Deleting file:', filePath);
        try {
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                logger_1.logger.trace('[storage] File deleted successfully:', filePath);
                return true;
            }
            else {
                logger_1.logger.trace('[storage] File not found:', filePath);
                return false;
            }
        }
        catch (error) {
            logger_1.logger.error('[storage] Error deleting file:', error);
            throw error;
        }
    },
};
//# sourceMappingURL=storage.js.map