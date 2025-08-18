"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePitchData } from "@/hooks/pitch/usePitchData";
import { pitchService } from "@/services/pitch-service";
import { useAppDispatch } from "@/hooks/hooks";
import { loadPitchData, resetPitchState } from "@/store/slices/pitch-slice";
import { Loader2 } from "lucide-react";
import type {
  CompanyInfoFormData,
  PitchDealFormData,
  TeamFormData,
  MediaFormData,
  DocumentsFormData,
  PackagesFormData,
  PitchTab,
} from "@/lib/types";

// Export PitchTab for use in other components
export type { PitchTab };

// Import components for the add pitch page
import PitchSidebar from "@/components/pitch/PitchSidebar";
import CompanyInfoForm from "@/components/pitch/CompanyInfoForm";
import PitchDealForm from "@/components/pitch/PitchDealForm";
import TeamForm from "@/components/pitch/TeamForm";
import MediaForm from "@/components/pitch/MediaForm";
import DocumentsForm from "@/components/pitch/DocumentsForm";
import PackagesForm from "@/components/pitch/PackagesForm";
import ContextualHelp from "@/components/pitch/ContextualHelp";

// Import subscription access controls
import {
  PitchCreationGuard,
  DocumentUploadGuard,
  PitchVisibilityIndicator,
} from "@/components/pitch/PitchCreationGuard";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

// Loading component for Suspense fallback
function AddPitchLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-slate-600 dark:text-slate-400">
          Loading pitch form...
        </span>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function AddPitchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading: authLoading } = useAuthUser();

  // Check if we're in edit mode
  const editPitchId = searchParams.get("edit");
  const isEditMode = !!editPitchId;

  const [helpContext, setHelpContext] = useState("company-info");

  const {
    activeTab,
    formData,
    completedSteps,
    isSubmitting,
    isLoading,
    isAutoSaving,
    lastSaved,
    handleTabChange,
    handleStepSubmit,
    isStepAccessible,
  } = usePitchData();

  // Fetch existing pitch data for edit mode
  const {
    data: existingPitchResponse,
    isLoading: isFetchingPitch,
    error: fetchError,
  } = useQuery({
    queryKey: ["pitch-edit", editPitchId],
    queryFn: () => pitchService.getMyPitchById(editPitchId!),
    enabled: !authLoading && isAuthenticated && isEditMode && !!editPitchId,
    retry: 1,
  });

  // Check if pitch can be edited (only drafts can be edited)
  const canEdit = existingPitchResponse?.data?.status === "draft";

  // Load existing pitch data into form when in edit mode
  useEffect(() => {
    if (isEditMode && existingPitchResponse?.data && !isLoading) {
      const pitchData = existingPitchResponse.data;

      // Only allow editing if pitch is draft
      if (pitchData.status !== "draft") {
        return; // Don't load data for published pitches
      }

      // Define interface for backend team member structure
      interface BackendTeamMember {
        name?: string;
        role?: string;
        bio?: string;
        linkedinUrl?: string;
        profileImage?: {
          public_id: string;
          url: string;
        };
        experience?: string;
        skills?: string[];
      }

      // Transform backend data to match form structure
      const transformedFormData = {
        companyInfo: {
          pitchTitle: pitchData.companyInfo?.pitchTitle || "",
          website: pitchData.companyInfo?.website || "",
          country: pitchData.companyInfo?.country || "",
          phoneNumber: pitchData.companyInfo?.phoneNumber || "",
          industry1: pitchData.companyInfo?.industry1 || "",
          industry2: pitchData.companyInfo?.industry2 || "",
          stage: pitchData.companyInfo?.stage || "",
          idealInvestorRole: pitchData.companyInfo?.idealInvestorRole || "",
          previousRaised: pitchData.companyInfo?.previousRaised || "",
          raisingAmount: pitchData.companyInfo?.raisingAmount || "",
          raisedSoFar: pitchData.companyInfo?.raisedSoFar || "",
          minimumInvestment: pitchData.companyInfo?.minimumInvestment || "",
        },
        pitchDeal: {
          summary: pitchData.pitchDeal?.summary || "",
          business: pitchData.pitchDeal?.business || "",
          market: pitchData.pitchDeal?.market || "",
          progress: pitchData.pitchDeal?.progress || "",
          objectives: pitchData.pitchDeal?.objectives || "",
          highlights: pitchData.pitchDeal?.highlights || [],
          dealType: pitchData.pitchDeal?.dealType || "equity",
          financials: pitchData.pitchDeal?.financials || [],
          tags: pitchData.pitchDeal?.tags || [],
        },
        team: {
          members: (pitchData.team?.members || []).map(
            (member: BackendTeamMember, index: number) => ({
              id: `member-${index}`,
              name: member.name || "",
              role: member.role || "",
              bio: member.bio || "",
              linkedinUrl: member.linkedinUrl || "",
              profileImage: member.profileImage
                ? {
                    public_id: member.profileImage.public_id,
                    url: member.profileImage.url,
                    originalName:
                      member.profileImage.url.split("/").pop() || "",
                  }
                : undefined,
              experience: member.experience || "",
              skills: member.skills || [],
            })
          ),
        },
        media: {
          videoType: pitchData.media?.videoType || "youtube",
          youtubeUrl: pitchData.media?.youtubeUrl || "",
          logo: pitchData.media?.logo
            ? {
                public_id: pitchData.media.logo.public_id,
                url: pitchData.media.logo.url,
                originalName: pitchData.media.logo.url.split("/").pop() || "",
              }
            : undefined,
          banner: pitchData.media?.banner
            ? {
                public_id: pitchData.media.banner.public_id,
                url: pitchData.media.banner.url,
                originalName: pitchData.media.banner.url.split("/").pop() || "",
              }
            : undefined,
          images: (pitchData.media?.images || []).map((img) => ({
            public_id: img.public_id,
            url: img.url,
            originalName: img.url.split("/").pop() || "",
          })),
          uploadedVideo: pitchData.media?.uploadedVideo
            ? {
                public_id: pitchData.media.uploadedVideo.public_id,
                url: pitchData.media.uploadedVideo.url,
                originalName:
                  pitchData.media.uploadedVideo.url.split("/").pop() || "",
              }
            : undefined,
        },
        documents: {
          businessPlan: pitchData.documents?.businessPlan
            ? {
                public_id: pitchData.documents.businessPlan.public_id,
                url: pitchData.documents.businessPlan.url,
                originalName: pitchData.documents.businessPlan.originalName,
              }
            : undefined,
          financials: pitchData.documents?.financials
            ? {
                public_id: pitchData.documents.financials.public_id,
                url: pitchData.documents.financials.url,
                originalName: pitchData.documents.financials.originalName,
              }
            : undefined,
          pitchDeck: pitchData.documents?.pitchDeck
            ? {
                public_id: pitchData.documents.pitchDeck.public_id,
                url: pitchData.documents.pitchDeck.url,
                originalName: pitchData.documents.pitchDeck.originalName,
              }
            : undefined,
          executiveSummary: pitchData.documents?.executiveSummary
            ? {
                public_id: pitchData.documents.executiveSummary.public_id,
                url: pitchData.documents.executiveSummary.url,
                originalName: pitchData.documents.executiveSummary.originalName,
              }
            : undefined,
          additionalDocuments: (
            pitchData.documents?.additionalDocuments || []
          ).map((doc) => ({
            public_id: doc.public_id,
            url: doc.url,
            originalName: doc.originalName,
          })),
        },
        packages: {
          selectedPackage: pitchData.package?.selectedPackage || "",
          paymentMethod: pitchData.package?.paymentMethod || "",
          agreeToTerms: pitchData.package?.agreeToTerms || false,
          packageDuration: pitchData.package?.packageDuration || 0,
          packagePrice: pitchData.package?.packagePrice || 0,
        },
      };

      // Load the data into the store
      dispatch(
        loadPitchData({
          formData: transformedFormData,
          completedSteps: pitchData.completedSteps || [],
          draftId: pitchData._id,
          lastSaved: pitchData.updatedAt || new Date().toISOString(),
        })
      );
    }
  }, [isEditMode, existingPitchResponse, isLoading, dispatch]);

  // Reset state when leaving edit mode
  useEffect(() => {
    if (!isEditMode) {
      dispatch(resetPitchState());
    }
  }, [isEditMode, dispatch]);

  // Block rendering until auth resolved and user authenticated
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-slate-600 dark:text-slate-400">
            Checking authentication...
          </span>
        </div>
      </div>
    );
  }

  // Handle loading states
  if (isEditMode && isFetchingPitch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-slate-600">Loading pitch data...</span>
        </div>
      </div>
    );
  }

  // Handle fetch error or published pitch edit attempt
  if (isEditMode && (fetchError || (existingPitchResponse?.data && !canEdit))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold text-slate-900">
            {!canEdit ? "Cannot Edit Published Pitch" : "Error Loading Pitch"}
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            {!canEdit
              ? "Published pitches cannot be edited. You can only edit draft pitches."
              : "We couldn't load the pitch data for editing. Please try again."}
          </p>
          <button
            onClick={() => router.push("/my-pitches")}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to My Pitches
          </button>
        </div>
      </div>
    );
  }

  const handleHelpContextChange = (context: string) => {
    setHelpContext(context);
  };

  const handleCompanyInfoSubmit = async (data: CompanyInfoFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const handlePitchDealSubmit = async (data: PitchDealFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const handleTeamSubmit = async (data: TeamFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const handleMediaSubmit = async (data: MediaFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const handleDocumentsSubmit = async (data: DocumentsFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const handlePackagesSubmit = async (data: PackagesFormData) => {
    await handleStepSubmit(activeTab, data);
  };

  const renderTabContent = () => {
    const commonProps = {
      onHelpContextChange: handleHelpContextChange,
      formData: formData,
    };

    switch (activeTab) {
      case "company-info":
        return (
          <CompanyInfoForm
            onSubmit={handleCompanyInfoSubmit}
            {...commonProps}
          />
        );
      case "pitch-deal":
        return (
          <PitchDealForm onSubmit={handlePitchDealSubmit} {...commonProps} />
        );
      case "team":
        return <TeamForm onSubmit={handleTeamSubmit} {...commonProps} />;
      case "media":
        return <MediaForm onSubmit={handleMediaSubmit} {...commonProps} />;
      case "documents":
        return (
          <DocumentUploadGuard variant="disable">
            <DocumentsForm onSubmit={handleDocumentsSubmit} {...commonProps} />
          </DocumentUploadGuard>
        );
      case "packages":
        return (
          <PackagesForm onSubmit={handlePackagesSubmit} {...commonProps} />
        );
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    const baseTitle = isEditMode ? "Edit Pitch" : "Add Pitch";
    switch (activeTab) {
      case "company-info":
        return `${baseTitle} - Company Information`;
      case "pitch-deal":
        return `${baseTitle} - Pitch & Deal Details`;
      case "team":
        return `${baseTitle} - Team Members`;
      case "media":
        return `${baseTitle} - Images & Videos`;
      case "documents":
        return `${baseTitle} - Documents`;
      case "packages":
        return `${baseTitle} - Select Package`;
      default:
        return baseTitle;
    }
  };

  const getPageDescription = () => {
    if (isEditMode) {
      switch (activeTab) {
        case "company-info":
          return "Update your company information";
        case "pitch-deal":
          return "Modify your business opportunity details";
        case "team":
          return "Update your team members";
        case "media":
          return "Update your company logo, images, and videos";
        case "documents":
          return "Update supporting documents for your pitch";
        case "packages":
          return "Change your package selection";
        default:
          return "Edit your pitch step by step";
      }
    } else {
      switch (activeTab) {
        case "company-info":
          return "Provide basic information about your company";
        case "pitch-deal":
          return "Describe your business opportunity in detail";
        case "team":
          return "Introduce your team members";
        case "media":
          return "Upload your company logo, images, and videos";
        case "documents":
          return "Upload supporting documents for your pitch";
        case "packages":
          return "Choose the best package for your needs";
        default:
          return "Create your pitch step by step";
      }
    }
  };

  return (
    <>
      <title>{`${getPageTitle()} | KonnectSphere`}</title>
      <meta
        name="description"
        content={
          isEditMode
            ? "Edit your funding pitch and update information for potential investors on KonnectSphere."
            : "Create a new funding pitch and connect with potential investors on KonnectSphere."
        }
      />

      <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Left Sidebar */}
        <div className="w-full lg:w-64 bg-[#1e2537] text-white">
          <PitchSidebar
            activeTab={activeTab}
            onTabChange={(tab) => {
              if (isStepAccessible(tab)) {
                handleTabChange(tab);
              }
            }}
            completedTabs={completedSteps}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Subscription Status Banner */}
            <div className="mb-6">
              <SubscriptionBanner showDetails={false} />
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {getPageTitle()}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {getPageDescription()}
                  </p>
                  {isEditMode && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Editing Mode
                      </span>
                    </div>
                  )}
                </div>

                {/* Save status indicator */}
                <div className="text-right">
                  {isAutoSaving && (
                    <div className="flex items-center space-x-2 text-slate-500 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400"></div>
                      <span>Auto-saving...</span>
                    </div>
                  )}
                  {lastSaved && !isAutoSaving && (
                    <div className="text-slate-500 text-sm">
                      Last saved: {new Date(lastSaved).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pitch Visibility Indicator */}
            <div className="mb-6">
              <PitchVisibilityIndicator />
            </div>

            {/* Wrap content with subscription guard */}
            <PitchCreationGuard showLimit={true}>
              <div className="relative">
                <div
                  className={
                    isSubmitting ? "opacity-75 pointer-events-none" : ""
                  }
                >
                  {renderTabContent()}
                </div>

                {/* Submitting overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center">
                    <div className="flex items-center space-x-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-lg">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {isEditMode ? "Updating..." : "Saving..."}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </PitchCreationGuard>
          </div>
        </div>

        {/* Right Help Panel */}
        <div className="hidden xl:block w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
          <ContextualHelp context={helpContext} />
        </div>
      </div>
    </>
  );
}

// Main page component with Suspense boundary
const AddPitchPage = () => {
  return (
    <Suspense fallback={<AddPitchLoading />}>
      <AddPitchContent />
    </Suspense>
  );
};

export default AddPitchPage;
