// File: app/account/components/ContactInfoTab.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Loader2, PencilIcon, Search } from "lucide-react";
import { useProfile } from "@/hooks/updateProfile/useProfileUpdate";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES } from "@/lib/constants";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// -------------------------
// Zod Schema & Types
// -------------------------
const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  bio: z.string().max(300, "Maximum 300 characters").optional(),
  countryName: z.string().min(1, "Country is required"),
  cityName: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  mobileNumber: z.string().optional(),
  isAccreditedInvestor: z.boolean().optional(),
});

type ContactFormData = z.infer<typeof formSchema>;

export default function ContactInfoTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    profile,
    isProfileLoading,
    updateProfile,
    isUpdating,
    isSuccess,
    resetMutation,
  } = useProfile();

  console.log("🔄 ContactInfo render state:", {
    isEditing,
    hasSelectedAvatar: !!selectedAvatar,
    selectedAvatarName: selectedAvatar?.name,
    hasAvatarPreview: !!avatarPreview,
    isUpdating,
  });

  // After a successful update, reset the form and UI state
  useEffect(() => {
    if (isSuccess) {
      console.log("🎉 Profile update successful, resetting UI state");
      setIsEditing(false);
      setSelectedAvatar(null);
      setAvatarPreview(null);
      resetMutation(); // Reset the mutation state
    }
  }, [isSuccess, resetMutation]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
      countryName: "",
      cityName: "",
      phoneNumber: "",
      mobileNumber: "",
      isAccreditedInvestor: false,
    },
  });

  useEffect(() => {
    if (profile && !isProfileLoading) {
      const [firstName = "", lastName = ""] = (profile.fullName || "").split(
        " "
      );
      reset({
        firstName,
        lastName,
        email: profile.email || "",
        bio: profile.bio || "",
        countryName: profile.countryName || "",
        cityName: profile.cityName || "",
        phoneNumber: profile.phoneNumber || "",
        mobileNumber: profile.mobileNumber || "",
        isAccreditedInvestor: profile.isAccreditedInvestor || false,
      });
    }
  }, [profile, isProfileLoading, reset]);

  const formData = watch();

  const onSubmit = (data: ContactFormData) => {
    console.log("📤 Submitting profile update:", {
      hasAvatar: !!selectedAvatar,
      avatarName: selectedAvatar?.name,
      formDataFields: Object.keys(data),
    });

    const formData = new FormData();

    // Add profile data
    formData.append("fullName", `${data.firstName} ${data.lastName}`);
    Object.entries(data).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        key !== "firstName" &&
        key !== "lastName"
      ) {
        formData.append(key, value.toString());
      }
    });

    if (selectedAvatar) {
      console.log("📸 Adding avatar to form data:", {
        name: selectedAvatar.name,
        size: selectedAvatar.size,
        type: selectedAvatar.type,
        lastModified: selectedAvatar.lastModified,
      });
      formData.append("avatarImage", selectedAvatar);
      console.log("✅ Avatar appended to FormData under 'avatarImage' field");
    } else {
      console.log("❌ No selectedAvatar - skipping avatar upload");
    }

    // Debug: Log all FormData entries
    console.log("📦 FormData contents:");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(
          `  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`
        );
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    console.log("🚀 Calling updateProfile with FormData");
    updateProfile(formData);
  };

  const handleImageClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📸 Avatar file selected:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
        console.log("✅ Avatar preview generated successfully");
      };
      reader.readAsDataURL(file);
    }
  };

  const avatarUrl =
    avatarPreview || profile?.avatarImage?.url || "/images/avatar.png";

  console.log("🖼️ Avatar URL determination:", {
    avatarPreview: !!avatarPreview,
    profileAvatarUrl: profile?.avatarImage?.url,
    finalAvatarUrl: avatarUrl,
    profileObject: profile?.avatarImage,
  });

  const getInitials = () => {
    if (!profile?.fullName) return "?";
    return profile.fullName
      .split(" ")
      .map((name: string) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isProfileLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-muted/30 rounded-lg p-6 mb-6">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
        <div className="bg-muted/30 rounded-lg p-6 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-primary/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="relative">
              <>
                <Avatar
                  className={`h-24 w-24 border-4 border-background ${
                    isEditing ? "cursor-pointer" : ""
                  }`}
                  onClick={handleImageClick}
                >
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background border-border"
                    onClick={handleImageClick}
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Upload avatar</span>
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </>
            </div>

            <div className="flex items-center justify-center gap-1">
              <h3 className="text-xl font-semibold">
                {formData.firstName} {formData.lastName}
              </h3>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <p className="text-muted-foreground">{formData.email}</p>
            <div className="flex gap-2 justify-center mt-1">
              {profile?.role && (
                <span className="inline-block px-2 py-1 bg-primary/20 text-xs rounded-full">
                  {profile.role}
                </span>
              )}

              {profile?.subscriptionPlan === "Investor Access Plan" ? (
                <span className="inline-block px-2 py-1 bg-primary/30 text-xs rounded-full">
                  Investor Access Plan
                </span>
              ) : (
                <span className="inline-block px-2 py-1 bg-primary/30 text-xs rounded-full">
                  {profile?.subscriptionPlan} Plan
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                disabled={!isEditing}
                className={!isEditing ? "cursor-default" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...register("lastName")}
                disabled={!isEditing}
                className={!isEditing ? "cursor-default" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">
                  {errors.lastName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                {...register("email")}
                disabled={true}
                className="cursor-default"
              />
              <p className="text-xs text-muted-foreground">
                Your email address is verified
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                {...register("phoneNumber")}
                disabled={!isEditing}
                className={!isEditing ? "cursor-default" : ""}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-destructive">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNumber">Mobile Number (Optional)</Label>
              <Input
                id="mobileNumber"
                {...register("mobileNumber")}
                disabled={!isEditing}
                className={!isEditing ? "cursor-default" : ""}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="countryName">Country *</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={!isEditing}
                    className={cn(
                      "w-full justify-between",
                      !formData.countryName && "text-muted-foreground"
                    )}
                  >
                    {formData.countryName || "Select country..."}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search country..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {COUNTRIES.map((country) => (
                        <CommandItem
                          key={country}
                          onSelect={() => {
                            setValue("countryName", country);
                            setOpen(false);
                          }}
                        >
                          {country}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.countryName && (
                <p className="text-sm text-destructive">
                  {errors.countryName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityName">City (Optional)</Label>
              <Input
                id="cityName"
                {...register("cityName")}
                disabled={!isEditing}
                className={!isEditing ? "cursor-default" : ""}
              />
            </div>

            {profile?.role === "Investor" && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isAccreditedInvestor">
                    Accredited Investor
                  </Label>
                  <Switch
                    id="isAccreditedInvestor"
                    checked={formData.isAccreditedInvestor}
                    onCheckedChange={(checked) =>
                      setValue("isAccreditedInvestor", checked)
                    }
                    disabled={!isEditing}
                    className={!isEditing ? "cursor-default" : ""}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  I certify that I am an accredited investor as defined by
                  securities regulations
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              rows={5}
              {...register("bio")}
              disabled={!isEditing}
              className={!isEditing ? "cursor-default" : ""}
            />
            <div className="flex justify-between text-xs">
              <span>
                Share your background and proficiency in English Speaking
              </span>
              <span className="text-muted-foreground">
                {formData.bio?.length ?? 0}/300
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {!isEditing ? (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdating}
                  onClick={() => {
                    reset();
                    setIsEditing(false);
                    // Also reset avatar preview if user cancels
                    setAvatarPreview(null);
                    setSelectedAvatar(null);
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
