import { useState, useRef, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronLeft,
  PlusCircle,
  Trash2,
  User,
  Briefcase,
  Linkedin,
  Upload,
  X,
} from "lucide-react";
import FormSection from "./shared/FormSection";
import CharacterCount from "./shared/CharacterCount";
import { TeamFormData, TeamMember } from "@/lib/types";
import Image from "next/image";

interface TeamFormProps {
  onSubmit: (data: TeamFormData) => void;
  onHelpContextChange: (context: string) => void;
  formData?: {
    team?: {
      members?: TeamMember[];
    };
  };
}

// Client-side Image wrapper to prevent hydration issues
const ClientImage = ({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        className={`${className} bg-slate-200 dark:bg-slate-700 animate-pulse`}
        style={{ width, height }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
    />
  );
};

const TeamForm = ({
  onSubmit,
  onHelpContextChange,
  formData,
}: TeamFormProps) => {
  const [isAddingMember, setIsAddingMember] = useState(false);

  // File input refs for each team member
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Helper function to get initial form values
  const getInitialValues = (): TeamFormData => {
    if (formData?.team?.members && formData.team.members.length > 0) {
      return {
        members: formData.team.members.map((member) => ({
          ...member,
          id: member.id || `member-${Date.now()}-${Math.random()}`,
        })),
      };
    }

    return {
      members: [
        {
          id: "1",
          name: "",
          role: "",
          linkedinUrl: "",
          bio: "",
          profileImage: undefined,
          experience: "",
          skills: [],
        },
      ],
    };
  };

  const form = useForm<TeamFormData>({
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  // Reset form when formData changes (when loading from backend)
  useEffect(() => {
    if (formData?.team?.members) {
      form.reset(getInitialValues());
    }
  }, [formData?.team?.members, form]);

  const handleSubmit = (values: TeamFormData) => {
    // Generate IDs for new members and prepare file data
    const membersWithFiles = values.members.map((member, index) => {
      const memberWithId = {
        ...member,
        id: member.id || `member-${Date.now()}-${index}`,
      };

      // Add file data if a new file was selected
      const fileInput = fileInputRefs.current[`member-${index}`];
      if (fileInput?.files?.[0]) {
        return {
          ...memberWithId,
          profileImageFile: fileInput.files[0],
        };
      }

      return memberWithId;
    });

    onSubmit({ members: membersWithFiles });
  };

  const handleFieldFocus = (fieldName: string) => {
    if (fieldName === "members") {
      onHelpContextChange("team-members");
    } else {
      onHelpContextChange("");
    }
  };

  const addTeamMember = () => {
    append({
      id: `member-${Date.now()}`,
      name: "",
      role: "",
      linkedinUrl: "",
      bio: "",
      profileImage: undefined,
      experience: "",
      skills: [],
    });
    setIsAddingMember(true);

    // Automatically scroll to the new card
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    memberIndex: number
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Update form with preview (temporary)
      form.setValue(`members.${memberIndex}.profileImage`, {
        public_id: `temp-${Date.now()}`,
        url: previewUrl,
        originalName: file.name,
      });
    }
  };

  const removeProfileImage = (memberIndex: number) => {
    // Clear the form field
    form.setValue(`members.${memberIndex}.profileImage`, undefined);

    // Clear the file input
    const fileInput = fileInputRefs.current[`member-${memberIndex}`];
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormSection
          title="Team Members"
          description="Add key members of your leadership team"
        >
          <div className="space-y-6">
            {fields.map((field, index) => (
              <Card
                key={field.id}
                className={`border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden
                  ${
                    index === fields.length - 1 && isAddingMember
                      ? "animate-slideIn"
                      : ""
                  }`}
              >
                <CardHeader className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Team Member {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name={`members.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="John Doe"
                                  {...field}
                                  className="pl-10"
                                  onFocus={() => handleFieldFocus("members")}
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`members.${index}.role`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position / Role</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="CEO / CTO / COO"
                                  {...field}
                                  className="pl-10"
                                  onFocus={() => handleFieldFocus("members")}
                                />
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`members.${index}.experience`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="5+ years in AI/ML"
                                {...field}
                                onFocus={() => handleFieldFocus("members")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`members.${index}.linkedinUrl`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              LinkedIn URL{" "}
                              <span className="text-slate-500 font-normal">
                                (Optional)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="https://linkedin.com/in/username"
                                  {...field}
                                  className="pl-10"
                                  onFocus={() => handleFieldFocus("members")}
                                />
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name={`members.${index}.profileImage`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profile Image</FormLabel>
                            <FormControl>
                              <div
                                className="bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-6 flex flex-col items-center justify-center h-[120px] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                onClick={() => {
                                  const input =
                                    fileInputRefs.current[`member-${index}`];
                                  if (input) input.click();
                                }}
                              >
                                <input
                                  ref={(el) => {
                                    fileInputRefs.current[`member-${index}`] =
                                      el;
                                  }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleFileInputChange(e, index)
                                  }
                                />

                                {field.value?.url ? (
                                  <div className="relative w-full h-full flex items-center justify-center">
                                    <ClientImage
                                      src={field.value.url}
                                      alt="Profile"
                                      className="w-16 h-16 rounded-full object-cover"
                                      width={64}
                                      height={64}
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProfileImage(index);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-sm text-slate-500 text-center">
                                      Click to upload profile image
                                    </p>
                                    <p className="text-xs text-slate-400 text-center mt-1">
                                      PNG, JPG up to 10MB
                                    </p>
                                  </>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Bio and Skills Section */}
                  <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <FormField
                      control={form.control}
                      name={`members.${index}.bio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio / Background</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Textarea
                                placeholder="Brief description of their background, expertise, and role in your company..."
                                {...field}
                                className="min-h-[100px] resize-none"
                                onFocus={() => handleFieldFocus("members")}
                              />
                              <div className="absolute bottom-2 right-2">
                                <CharacterCount
                                  current={field.value?.length || 0}
                                  maximum={500}
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.skills`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Skills (comma separated)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Leadership, Product Development, AI/ML, Marketing"
                              value={field.value?.join(", ") || ""}
                              onChange={(e) => {
                                const skills = e.target.value
                                  .split(",")
                                  .map((skill) => skill.trim())
                                  .filter((skill) => skill !== "");
                                field.onChange(skills);
                              }}
                              onFocus={() => handleFieldFocus("members")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addTeamMember}
                className="w-full max-w-md border-dashed"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Another Team Member
              </Button>
            </div>
          </div>
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

export default TeamForm;
