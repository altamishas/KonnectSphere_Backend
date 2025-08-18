import { UploadResponse, UploadOptions } from "@/lib/types";

export class UploadService {
  private static instance: UploadService;

  static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  // Default upload options
  private defaultOptions: UploadOptions = {
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ],
    multiple: false,
  };

  /**
   * Validate file before upload
   */
  private validateFile(
    file: File,
    options: UploadOptions
  ): { valid: boolean; error?: string } {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.formatFileSize(
          options.maxSize
        )} limit`,
      };
    }

    // Check file type
    if (options.acceptedTypes && !options.acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not supported`,
      };
    }

    return { valid: true };
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    options: Partial<UploadOptions> = {},
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    const mergedOptions = { ...this.defaultOptions, ...options };

    // Validate file
    const validation = this.validateFile(file, mergedOptions);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    try {
      // For now, we'll simulate the upload with a mock implementation
      // In a real app, you would upload to your backend or cloud storage
      return await this.mockUpload(file, onProgress);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: FileList | File[],
    options: Partial<UploadOptions> = {},
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse[]> {
    const fileArray = Array.from(files);
    const promises = fileArray.map((file, index) =>
      this.uploadFile(file, options, (progress) => {
        if (onProgress) {
          const totalProgress = (index * 100 + progress) / fileArray.length;
          onProgress(totalProgress);
        }
      })
    );

    return Promise.all(promises);
  }

  /**
   * Mock upload implementation
   * Replace this with your actual upload logic
   */
  private async mockUpload(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Create a URL for the uploaded file (in real app, this would be from your server)
          const url = URL.createObjectURL(file);

          resolve({
            success: true,
            url,
            progress: 100,
          });
        } else {
          onProgress?.(progress);
        }
      }, 200);
    });
  }

  /**
   * Upload image specifically
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(
      file,
      {
        maxSize: 5 * 1024 * 1024, // 5MB for images
        acceptedTypes: [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
        ],
      },
      onProgress
    );
  }

  /**
   * Upload document specifically
   */
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(
      file,
      {
        maxSize: 50 * 1024 * 1024, // 50MB for documents
        acceptedTypes: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ],
      },
      onProgress
    );
  }

  /**
   * Upload video specifically
   */
  async uploadVideo(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> {
    return this.uploadFile(
      file,
      {
        maxSize: 100 * 1024 * 1024, // 100MB for videos
        acceptedTypes: [
          "video/mp4",
          "video/webm",
          "video/ogg",
          "video/avi",
          "video/mov",
        ],
      },
      onProgress
    );
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      // In a real app, you would make an API call to delete the file
      // For now, we'll just revoke the object URL if it's a blob URL
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
      return true;
    } catch (error) {
      console.error("Failed to delete file:", error);
      return false;
    }
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance();
