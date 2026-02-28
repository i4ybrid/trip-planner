# Media Storage Configuration

The backend supports flexible media storage configuration via the `MEDIA_STORAGE_URL` environment variable.

## Configuration Options

### 1. Local Storage (Default)
Leave `MEDIA_STORAGE_URL` empty or unset:
```bash
MEDIA_STORAGE_URL=""
```
Files are stored in `./uploads` and served from `/uploads` on the backend.

### 2. Custom Local Path
Specify an absolute path for local storage:
```bash
MEDIA_STORAGE_URL="/var/www/uploads"
```
Files are stored in the specified directory and served from `/uploads` on the backend.

### 3. Remote CDN / File Server
Specify a full URL for remote storage:
```bash
MEDIA_STORAGE_URL="https://cdn.example.com/uploads"
```
- Files are **stored locally** in `./uploads`
- Files are **served from the remote URL**
- The backend does NOT serve static files in this mode
- You need to sync files to the remote server separately

## Examples

### Development (local storage)
```bash
# .env.local or .env
MEDIA_STORAGE_URL=""
```

### Production with S3/CloudFront
```bash
# .env.production
MEDIA_STORAGE_URL="https://d1234567.cloudfront.net/uploads"
```

### Production with custom file server
```bash
# .env.production
MEDIA_STORAGE_URL="https://files.example.com/media"
```

## Future Enhancements

For true remote storage (uploading directly to S3, Cloudinary, etc.), see the S3 configuration in `.env.example`. Future implementations could:
- Upload directly to S3 using pre-signed URLs
- Use Cloudinary or similar services
- Implement automatic sync to CDN

## Environment Variable Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `MEDIA_STORAGE_URL` | Storage location (path or URL) | `""` (local ./uploads) |

## File Upload Flow

1. Client sends file via `POST /api/trips/:tripId/media`
2. Backend saves file to `storageConfig.uploadDir`
3. Backend returns URL based on `storageConfig.baseUrl`
4. Client displays file using returned URL
