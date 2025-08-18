import { useRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaFormData } from "@/lib/types";
import { pitchService } from "@/services/pitch-service";

import {
  ChevronRight,
  ChevronLeft,
  Upload,
  Image as ImageIcon,
  Youtube,
  X,
} from "lucide-react";
import FormSection from "./shared/FormSection";
import Image from "next/image";

interface MediaFormProps {
  onSubmit: (data: MediaFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    media?: {
      logo?: {
        public_id: string;
        url: string;
        originalName?: string;
      };
      banner?: {
        public_id: string;
        url: string;
        originalName?: string;
      };
      images?: {
        public_id: string;
        url: string;
        originalName?: string;
      }[];
      videoType?: "youtube" | "upload";
      youtubeUrl?: string;
      uploadedVideo?: {
        public_id: string;
        url: string;
        originalName?: string;
      };
    };
  };
}

const MediaForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: MediaFormProps) => {
  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Loading states for file removal
  const [removingLogo, setRemovingLogo] = useState(false);
  const [removingBanner, setRemovingBanner] = useState(false);
  const [removingVideo, setRemovingVideo] = useState(false);

  // Helper function to get initial form values
  const getInitialValues = (): MediaFormData => {
    if (formData?.media) {
      return {
        logo: formData.media.logo || undefined,
        banner: formData.media.banner || undefined,
        images: formData.media.images || [],
        videoType: formData.media.videoType || "youtube",
        youtubeUrl: formData.media.youtubeUrl || "",
        uploadedVideo: formData.media.uploadedVideo || undefined,
      };
    }

    return {
      logo: undefined,
      banner: undefined,
      images: [],
      videoType: "youtube",
      youtubeUrl: "",
      uploadedVideo: undefined,
    };
  };

  const form = useForm<MediaFormData>({
    defaultValues: getInitialValues(),
  });

  // Reset form when formData changes (when loading from backend)
  useEffect(() => {
    if (formData?.media) {
      form.reset(getInitialValues());
    }
  }, [formData?.media, form]);

  const handleSubmit = (values: MediaFormData) => {
    // Collect file objects from refs
    const submitData: MediaFormData = {
      ...values,
    };

    // Add file objects if new files were selected
    if (logoInputRef.current?.files?.[0]) {
      submitData.logoFile = logoInputRef.current.files[0];
      // Include current logo info for deletion
      if (formData?.media?.logo) {
        submitData.currentLogo = formData.media.logo;
      }
    }

    if (bannerInputRef.current?.files?.[0]) {
      submitData.bannerFile = bannerInputRef.current.files[0];
      // Include current banner info for deletion
      if (formData?.media?.banner) {
        submitData.currentBanner = formData.media.banner;
      }
    }

    if (videoInputRef.current?.files?.[0]) {
      submitData.uploadedVideoFile = videoInputRef.current.files[0];
      // Include current video info for deletion
      if (formData?.media?.uploadedVideo) {
        submitData.currentUploadedVideo = formData.media.uploadedVideo;
      }
    }

    onSubmit(submitData);
  };

  const handleHelp = (context: string) => onHelpContextChange?.(context);

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (fieldName === "video" && !file.type.startsWith("video/")) {
      alert("Please select a valid video file");
      return;
    }

    if (fieldName !== "video" && !file.type.startsWith("image/")) {
      alert("Please select a valid image file");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Update form with preview (temporary)
    if (fieldName === "logo") {
      form.setValue("logo", {
        public_id: `temp-${Date.now()}`,
        url: previewUrl,
        originalName: file.name,
      });
    } else if (fieldName === "banner") {
      form.setValue("banner", {
        public_id: `temp-${Date.now()}`,
        url: previewUrl,
        originalName: file.name,
      });
    } else if (fieldName === "video") {
      form.setValue("uploadedVideo", {
        public_id: `temp-${Date.now()}`,
        url: previewUrl,
        originalName: file.name,
      });
    }
  };

  const removeImage = async (
    fieldName: "logo" | "banner" | "uploadedVideo"
  ) => {
    const currentFile = form.getValues(fieldName);

    // If it's an existing file (has public_id and not temp), remove from backend
    if (currentFile?.public_id && !currentFile.public_id.startsWith("temp-")) {
      try {
        if (fieldName === "logo") setRemovingLogo(true);
        if (fieldName === "banner") setRemovingBanner(true);
        if (fieldName === "uploadedVideo") setRemovingVideo(true);

        await pitchService.removeMediaFile(fieldName, currentFile.public_id);

        // Success - remove from form
        form.setValue(fieldName, undefined);

        // Clear the corresponding file input
        if (fieldName === "logo" && logoInputRef.current) {
          logoInputRef.current.value = "";
        } else if (fieldName === "banner" && bannerInputRef.current) {
          bannerInputRef.current.value = "";
        } else if (fieldName === "uploadedVideo" && videoInputRef.current) {
          videoInputRef.current.value = "";
        }
      } catch (error) {
        console.error("Error removing file:", error);
        alert("Failed to remove file. Please try again.");
      } finally {
        if (fieldName === "logo") setRemovingLogo(false);
        if (fieldName === "banner") setRemovingBanner(false);
        if (fieldName === "uploadedVideo") setRemovingVideo(false);
      }
    } else {
      // It's a temporary file (just selected), remove from form only
      form.setValue(fieldName, undefined);

      // Clear the corresponding file input
      if (fieldName === "logo" && logoInputRef.current) {
        logoInputRef.current.value = "";
      } else if (fieldName === "banner" && bannerInputRef.current) {
        bannerInputRef.current.value = "";
      } else if (fieldName === "uploadedVideo" && videoInputRef.current) {
        videoInputRef.current.value = "";
      }

      // Clean up preview URL if it exists
      if (currentFile?.url && currentFile.url.startsWith("blob:")) {
        URL.revokeObjectURL(currentFile.url);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Company Logo"
          description="Your primary brand identifier"
        >
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo Upload</FormLabel>
                <FormControl>
                  <div
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => {
                      handleHelp("logo-upload");
                      logoInputRef.current?.click();
                    }}
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInputChange(e, "logo")}
                    />

                    {field.value?.url ? (
                      <div className="relative">
                        <Image
                          src={field.value.url}
                          alt="Company Logo"
                          className="max-w-32 max-h-32 object-contain"
                          width={128}
                          height={128}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          disabled={removingLogo}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("logo");
                          }}
                        >
                          {removingLogo ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-sm text-slate-500 text-center mb-2">
                          Click to upload your company logo
                        </p>
                        <p className="text-xs text-slate-400 text-center">
                          PNG, JPG up to 10MB. Recommended: 300x300px
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Banner Image"
          description="A banner image for your pitch"
        >
          <FormField
            control={form.control}
            name="banner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banner Upload</FormLabel>
                <FormControl>
                  <div
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => {
                      handleHelp("banner-upload");
                      bannerInputRef.current?.click();
                    }}
                  >
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileInputChange(e, "banner")}
                    />

                    {field.value?.url ? (
                      <div className="relative w-full max-w-md">
                        <Image
                          src={field.value.url}
                          alt="Banner"
                          className="w-full h-32 object-cover rounded"
                          width={400}
                          height={128}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          disabled={removingBanner}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("banner");
                          }}
                        >
                          {removingBanner ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-sm text-slate-500 text-center mb-2">
                          Click to upload banner image
                        </p>
                        <p className="text-xs text-slate-400 text-center">
                          PNG, JPG up to 10MB. Recommended: 1200x400px
                        </p>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          title="Video"
          description="Add a video to showcase your pitch"
        >
          <Tabs
            value={form.watch("videoType")}
            onValueChange={(value) =>
              form.setValue("videoType", value as "youtube" | "upload")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="youtube"
                onClick={() => handleHelp("youtube-video")}
              >
                YouTube
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                onClick={() => handleHelp("upload-video")}
              >
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube" className="space-y-4">
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="https://www.youtube.com/watch?v=..."
                          {...field}
                          className="pl-10"
                          onFocus={() => handleHelp("youtube-video")}
                        />
                        <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <FormField
                control={form.control}
                name="uploadedVideo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upload Video</FormLabel>
                    <FormControl>
                      <div
                        className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        onClick={() => {
                          handleHelp("upload-video");
                          videoInputRef.current?.click();
                        }}
                      >
                        <input
                          ref={videoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => handleFileInputChange(e, "video")}
                        />

                        {field.value?.url ? (
                          <div className="relative w-full max-w-md">
                            <video
                              src={field.value.url}
                              className="w-full h-32 object-cover rounded"
                              controls
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                              disabled={removingVideo}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage("uploadedVideo");
                              }}
                            >
                              {removingVideo ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-12 w-12 text-slate-400 mb-4" />
                            <p className="text-sm text-slate-500 text-center mb-2">
                              Click to upload video
                            </p>
                            <p className="text-xs text-slate-400 text-center">
                              MP4, MOV up to 50MB
                            </p>
                          </>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </FormSection>

        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="outline" className="flex items-center">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Step
          </Button>

          <Button type="submit" className="flex items-center">
            Save & Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default MediaForm;
