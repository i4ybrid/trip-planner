export declare const storageConfig: {
    /** Absolute path to local uploads directory */
    uploadDir: string;
    /** Base URL for accessing files (either /uploads or remote CDN URL) */
    baseUrl: string;
    /** Whether files are served from a remote URL */
    isRemote: boolean;
    /** Get full URL for a file */
    getFileUrl: (filename: string) => string;
    /**
     * Delete a file from storage
     * @param url - The full URL or path of the file to delete
     * @returns Promise resolving to true if deleted, false if file didn't exist
     */
    deleteFile: (url: string) => Promise<boolean>;
};
//# sourceMappingURL=storage.d.ts.map