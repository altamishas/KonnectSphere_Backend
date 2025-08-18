"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Loader2, Plus, X, Upload, Building2 } from "lucide-react";
import { useProfile } from "@/hooks/updateProfile/useProfileUpdate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Company positions
const POSITIONS = [
  "Founder",
  "Co-Founder",
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "President",
  "Vice President",
  "Director",
  "Senior Manager",
  "Manager",
  "Senior Advisor",
  "Board Member",
  "Investor",
  "Angel Investor",
  "Venture Capitalist",
  "Partner",
  "Senior Partner",
  "Principal",
  "Associate",
  "Analyst",
  "Consultant",
  "Other",
];

const companySchema = z.object({
  id: z.string().optional(),
  logo: z
    .object({
      public_id: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  logoUrl: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

const formSchema = z.object({
  // Social Media Links
  linkedinUrl: z
    .string()
    .url("Must be a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url("Must be a valid Instagram URL")
    .optional()
    .or(z.literal("")),
  facebookUrl: z
    .string()
    .url("Must be a valid Facebook URL")
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url("Must be a valid X/Twitter URL")
    .optional()
    .or(z.literal("")),
  skypeId: z.string().optional(),
  personalWebsite: z
    .string()
    .url("Must be a valid website URL")
    .optional()
    .or(z.literal("")),

  // Profile Information
  aboutMe: z.string().min(10, "About me must be at least 10 characters"),
  specializedField: z
    .string()
    .min(10, "Specialized field must be at least 10 characters"),
  previousInvestments: z
    .number()
    .min(0, "Previous investments must be 0 or more"),

  // Companies
  companies: z.array(companySchema),
});

type ProfileInfoFormData = z.infer<typeof formSchema>;

export default function ProfileInfoTab() {
  const [companyLogos, setCompanyLogos] = useState<{ [key: string]: File }>({});
  const [logoPreviewUrls, setLogoPreviewUrls] = useState<{
    [key: string]: string;
  }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const { profile, isProfileLoading, updateProfile, isUpdating } = useProfile();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfileInfoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      linkedinUrl: "",
      instagramUrl: "",
      facebookUrl: "",
      twitterUrl: "",
      skypeId: "",
      personalWebsite: "",
      aboutMe: "",
      specializedField: "",
      previousInvestments: 0,
      companies: [],
    },
  });

  const {
    fields: companyFields,
    append: addCompany,
    remove: removeCompany,
  } = useFieldArray({
    control,
    name: "companies",
  });

  useEffect(() => {
    if (profile && !isProfileLoading) {
      const profileInfo = profile.profileInfo || {};

      reset({
        linkedinUrl: profileInfo.linkedinUrl || "",
        instagramUrl: profileInfo.instagramUrl || "",
        facebookUrl: profileInfo.facebookUrl || "",
        twitterUrl: profileInfo.twitterUrl || "",
        skypeId: profileInfo.skypeId || "",
        personalWebsite: profileInfo.personalWebsite || "",
        aboutMe: profileInfo.aboutMe || "",
        specializedField: profileInfo.specializedField || "",
        previousInvestments: profileInfo.previousInvestments || 0,
        companies: profileInfo.companies || [],
      });

      // Set logo preview URLs for existing companies
      if (profileInfo.companies && profileInfo.companies.length > 0) {
        const previewUrls: { [key: string]: string } = {};
        profileInfo.companies.forEach((company: unknown, index: number) => {
          if (company && typeof company === "object" && company !== null) {
            const typedCompany = company as {
              logoUrl?: string;
              logo?: { url?: string };
            };
            const logoUrl = typedCompany.logoUrl || typedCompany.logo?.url;
            if (logoUrl) {
              previewUrls[index.toString()] = logoUrl;
            }
          }
        });
        setLogoPreviewUrls(previewUrls);
      }
    }
  }, [profile, isProfileLoading, reset]);

  const formData = watch();

  const onSubmit = (data: ProfileInfoFormData) => {
    const formDataToSend = new FormData();

    // Create profile info object
    const profileInfo = {
      linkedinUrl: data.linkedinUrl,
      instagramUrl: data.instagramUrl,
      facebookUrl: data.facebookUrl,
      twitterUrl: data.twitterUrl,
      skypeId: data.skypeId,
      personalWebsite: data.personalWebsite,
      aboutMe: data.aboutMe,
      specializedField: data.specializedField,
      previousInvestments: data.previousInvestments,
      companies: data.companies.map((company, index) => ({
        ...company,
        logoUrl: logoPreviewUrls[index.toString()] || company.logoUrl,
      })),
    };

    formDataToSend.append("profileInfo", JSON.stringify(profileInfo));

    // Append company logos
    Object.entries(companyLogos).forEach(([index, file]) => {
      formDataToSend.append(`companyLogo_${index}`, file);
    });

    // Call updateProfile - the hook will handle success/error callbacks
    updateProfile(formDataToSend);
  };

  const handleAddCompany = () => {
    addCompany({
      id: Date.now().toString(),
      companyName: "",
      position: "",
      description: "",
      website: "",
    });
  };

  const handleLogoUpload = (index: number, file: File) => {
    setCompanyLogos((prev) => ({ ...prev, [index.toString()]: file }));

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreviewUrls((prev) => ({
        ...prev,
        [index.toString()]: e.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCompany = (index: number) => {
    removeCompany(index);
    // Clean up logo data
    const newLogos = { ...companyLogos };
    const newPreviewUrls = { ...logoPreviewUrls };
    delete newLogos[index.toString()];
    delete newPreviewUrls[index.toString()];
    setCompanyLogos(newLogos);
    setLogoPreviewUrls(newPreviewUrls);
  };

  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Profile Information</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Social Media Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Social Media & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  {...register("linkedinUrl")}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {errors.linkedinUrl && (
                  <p className="text-sm text-destructive">
                    {errors.linkedinUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagramUrl">Instagram URL</Label>
                <Input
                  id="instagramUrl"
                  {...register("instagramUrl")}
                  placeholder="https://instagram.com/yourprofile"
                />
                {errors.instagramUrl && (
                  <p className="text-sm text-destructive">
                    {errors.instagramUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebookUrl">Facebook URL</Label>
                <Input
                  id="facebookUrl"
                  {...register("facebookUrl")}
                  placeholder="https://facebook.com/yourprofile"
                />
                {errors.facebookUrl && (
                  <p className="text-sm text-destructive">
                    {errors.facebookUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitterUrl">X (Twitter) URL</Label>
                <Input
                  id="twitterUrl"
                  {...register("twitterUrl")}
                  placeholder="https://x.com/yourprofile"
                />
                {errors.twitterUrl && (
                  <p className="text-sm text-destructive">
                    {errors.twitterUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="skypeId">Skype ID</Label>
                <Input
                  id="skypeId"
                  {...register("skypeId")}
                  placeholder="your.skype.id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalWebsite">Personal Website</Label>
                <Input
                  id="personalWebsite"
                  {...register("personalWebsite")}
                  placeholder="https://yourwebsite.com"
                />
                {errors.personalWebsite && (
                  <p className="text-sm text-destructive">
                    {errors.personalWebsite.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Me & Specialized Field */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About You</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aboutMe">About Me *</Label>
              <Textarea
                id="aboutMe"
                {...register("aboutMe")}
                placeholder="Tell us about yourself, your background, investment philosophy, and what drives your investment decisions..."
                rows={5}
              />
              {errors.aboutMe && (
                <p className="text-sm text-destructive">
                  {errors.aboutMe.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specializedField">Specialized Field *</Label>
              <Textarea
                id="specializedField"
                {...register("specializedField")}
                placeholder="Describe your areas of expertise, industries you specialize in, and specific domains where you add the most value..."
                rows={5}
              />
              {errors.specializedField && (
                <p className="text-sm text-destructive">
                  {errors.specializedField.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="previousInvestments">
                Previous Investments *
              </Label>
              <Input
                id="previousInvestments"
                type="number"
                {...register("previousInvestments", { valueAsNumber: true })}
                placeholder="Number of companies you've invested in"
                min="0"
              />
              {errors.previousInvestments && (
                <p className="text-sm text-destructive">
                  {errors.previousInvestments.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Companies
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCompany}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Add companies you founded, invested in, or worked for
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyFields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No companies added yet</p>
                <p className="text-sm">Click Add Company to get started</p>
              </div>
            ) : (
              companyFields.map((field, index) => (
                <Card key={field.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium">Company {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCompany(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {/* Logo Upload */}
                      <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage
                              src={logoPreviewUrls[index.toString()] || ""}
                              alt="Company Logo"
                            />
                            <AvatarFallback>
                              <Building2 className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              fileInputRefs.current[index.toString()]?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload className="h-4 w-4" />
                            Upload Logo
                          </Button>
                          <input
                            type="file"
                            ref={(el) => {
                              fileInputRefs.current[index.toString()] = el;
                            }}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleLogoUpload(index, file);
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`companies.${index}.companyName`}>
                            Company Name *
                          </Label>
                          <Input
                            {...register(`companies.${index}.companyName`)}
                            placeholder="Company name"
                          />
                          {errors.companies?.[index]?.companyName && (
                            <p className="text-sm text-destructive">
                              {errors.companies[index]?.companyName?.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`companies.${index}.position`}>
                            Position *
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue(`companies.${index}.position`, value)
                            }
                            defaultValue={formData.companies[index]?.position}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                            <SelectContent>
                              {POSITIONS.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.companies?.[index]?.position && (
                            <p className="text-sm text-destructive">
                              {errors.companies[index]?.position?.message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`companies.${index}.website`}>
                          Website
                        </Label>
                        <Input
                          {...register(`companies.${index}.website`)}
                          placeholder="https://company-website.com"
                        />
                        {errors.companies?.[index]?.website && (
                          <p className="text-sm text-destructive">
                            {errors.companies[index]?.website?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`companies.${index}.description`}>
                          Description *
                        </Label>
                        <Textarea
                          {...register(`companies.${index}.description`)}
                          placeholder="Describe your role and contributions at this company..."
                          rows={3}
                        />
                        {errors.companies?.[index]?.description && (
                          <p className="text-sm text-destructive">
                            {errors.companies[index]?.description?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdating} className="min-w-[120px]">
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile Info"
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
