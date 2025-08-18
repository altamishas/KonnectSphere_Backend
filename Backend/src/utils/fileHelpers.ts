import path from "path";

// File type validation
export const isImageFile = (filename: string): boolean => {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
  return imageExtensions.test(filename);
};

export const isVideoFile = (filename: string): boolean => {
  const videoExtensions = /\.(mp4|avi|mov|wmv|webm|mkv)$/i;
  return videoExtensions.test(filename);
};

export const isDocumentFile = (filename: string): boolean => {
  const documentExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i;
  return documentExtensions.test(filename);
};

// File size validation (in bytes)
export const validateFileSize = (size: number, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = path.basename(originalName, extension);
  return `${nameWithoutExt}-${timestamp}-${random}${extension}`;
};

// Validate file by type and size
export const validateFile = (
  file: Express.Multer.File,
  allowedTypes: ("image" | "video" | "document")[],
  maxSizeMB: number = 50
): { isValid: boolean; error?: string } => {
  // Check file size
  if (!validateFileSize(file.size, maxSizeMB)) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  let isTypeValid = false;
  for (const type of allowedTypes) {
    switch (type) {
      case "image":
        if (isImageFile(file.originalname)) isTypeValid = true;
        break;
      case "video":
        if (isVideoFile(file.originalname)) isTypeValid = true;
        break;
      case "document":
        if (isDocumentFile(file.originalname)) isTypeValid = true;
        break;
    }
    if (isTypeValid) break;
  }

  if (!isTypeValid) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  return { isValid: true };
};

// File type to Cloudinary resource type mapping
export const getCloudinaryResourceType = (
  filename: string
): "image" | "video" | "raw" => {
  if (isImageFile(filename)) return "image";
  if (isVideoFile(filename)) return "video";
  return "raw";
};

// Sanitize filename for storage
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .toLowerCase();
};

// Extract file metadata
export const getFileMetadata = (file: Express.Multer.File) => {
  return {
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    extension: getFileExtension(file.originalname),
    type: getCloudinaryResourceType(file.originalname),
  };
};
