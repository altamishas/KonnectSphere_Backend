import cloudinary from "../config/cloudinaryConfig";

type ResourceType = "auto" | "raw" | "image" | "video";

export const uploadToCloudinary = async (
  FilePath: string,
  FolderName: string,
  resourceType: string,
  format?: string
) => {
  // Prepare the options object
  const options: {
    folder: string;
    resource_type: ResourceType;
    format?: string;
  } = {
    folder: FolderName,
    resource_type: resourceType as ResourceType,
  };

  // Add format only if it's provided
  if (format) {
    options.format = format;
  }

  // Upload the file
  return await cloudinary.uploader.upload(FilePath, options);
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: string
) => {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};
