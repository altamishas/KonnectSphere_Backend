import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { pitchService } from "@/services/pitch-service";
import {
  setActiveTab,
  updateStepData,
  setDirty,
  clearAllErrors,
  initializeFromStorage,
  setLoading,
  setSubmitting,
  setAutoSaving,
  setAutoSaved,
  setError,
  markStepCompleted,
  loadPitchData,
  selectPitchFormData,
  selectActiveTab,
  selectCompletedSteps,
  selectIsLoading,
  selectIsSubmitting,
  selectAutoSaveState,
  selectError,
  selectProgress,
  selectLastSaved,
} from "@/store/slices/pitch-slice";
import { RootState } from "@/store";
import type {
  PitchTab,
  CompanyInfoFormData,
  PitchDealFormData,
  TeamFormData,
  MediaFormData,
  DocumentsFormData,
  PackagesFormData,
} from "@/lib/types";

// Storage key for localStorage
const STORAGE_KEY = "pitch_draft_cache";
const AUTO_SAVE_DELAY = 3000; // 3 seconds debounce

// Type for step data
type StepFormData =
  | CompanyInfoFormData
  | PitchDealFormData
  | TeamFormData
  | MediaFormData
  | DocumentsFormData
  | PackagesFormData;

export const usePitchData = () => {
  const dispatch = useDispatch();
  const { handleError, handleSuccess } = useErrorHandler();
  const router = useRouter();

  // Redux selectors
  const formData = useSelector(selectPitchFormData);
  const activeTab = useSelector(selectActiveTab);
  const completedSteps = useSelector(selectCompletedSteps);
  const isLoading = useSelector(selectIsLoading);
  const isSubmitting = useSelector(selectIsSubmitting);
  const autoSaveState = useSelector(selectAutoSaveState);
  const error = useSelector(selectError);
  const progress = useSelector(selectProgress);
  const lastSaved = useSelector(selectLastSaved);

  // Auth state from Redux
  const authState = useSelector((state: RootState) => state.auth);
  const { isAuthenticated, isLoading: authLoading } = authState;

  // Local loading states
  const [isDraftLoading, setIsDraftLoading] = useState(true);
  const [isStepSubmitting, setIsStepSubmitting] = useState(false);
  const [isAutoSavingLocal, setIsAutoSavingLocal] = useState(false);

  // Auto-save timeout ref
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const loadFromStorage = () => {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          dispatch(initializeFromStorage(parsed));
        } catch (error) {
          console.error("Error parsing saved pitch data:", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadFromStorage();
  }, [dispatch]);

  // Load pitch draft from backend
  const loadPitchDraft = useCallback(async () => {
    // Don't load if user is not authenticated
    if (!isAuthenticated) {
      setIsDraftLoading(false);
      dispatch(setLoading(false));
      return;
    }

    setIsDraftLoading(true);
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await pitchService.getPitchDraft();
      if (response.success && response.data) {
        // Transform backend data to frontend format
        const transformedFormData = {
          companyInfo: response.data.companyInfo || {},
          pitchDeal: {
            ...response.data.pitchDeal,
            highlights: response.data.pitchDeal?.highlights || [],
            financials: response.data.pitchDeal?.financials || [],
            tags: response.data.pitchDeal?.tags || [],
          },
          team: {
            members:
              response.data.team?.members?.map(
                (member: {
                  _id?: string;
                  id?: string;
                  name: string;
                  role: string;
                  bio: string;
                  linkedinUrl?: string;
                  experience: string;
                  skills: string[];
                  profileImage?: {
                    public_id: string;
                    url: string;
                    originalName?: string;
                  };
                }) => ({
                  ...member,
                  id:
                    member._id ||
                    member.id ||
                    `member-${Date.now()}-${Math.random()}`,
                  profileImage: member.profileImage || undefined,
                })
              ) || [],
          },
          media: {
            videoType: response.data.media?.videoType || "youtube",
            youtubeUrl: response.data.media?.youtubeUrl || "",
            logo: response.data.media?.logo || undefined,
            banner: response.data.media?.banner || undefined,
            images: response.data.media?.images || [],
            uploadedVideo: response.data.media?.uploadedVideo || undefined,
          },
          documents: {
            businessPlan: response.data.documents?.businessPlan || undefined,
            financials: response.data.documents?.financials || undefined,
            pitchDeck: response.data.documents?.pitchDeck || undefined,
            executiveSummary:
              response.data.documents?.executiveSummary || undefined,
            additionalDocuments:
              response.data.documents?.additionalDocuments || [],
          },
          packages: response.data.package || {},
        };

        // Update Redux store
        dispatch(
          loadPitchData({
            formData: transformedFormData,
            completedSteps: response.data.completedSteps || [],
            draftId: response.data._id,
            lastSaved: response.data.updatedAt,
          })
        );

        // Update localStorage
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            formData: transformedFormData,
            activeTab,
            completedSteps: response.data.completedSteps || [],
            lastSaved: response.data.updatedAt,
          })
        );
      }
    } catch (err) {
      const errorMessage = handleError(
        err,
        "Failed to load your saved pitch data"
      );
      dispatch(setError(errorMessage));
    } finally {
      setIsDraftLoading(false);
      dispatch(setLoading(false));
    }
  }, [dispatch, activeTab, isAuthenticated, handleError]);

  // Load data when authentication state changes
  useEffect(() => {
    // Only load data when auth is not loading and user is authenticated
    if (!authLoading) {
      if (isAuthenticated) {
        loadPitchDraft();
      } else {
        // User is not authenticated, clear loading state
        setIsDraftLoading(false);
        dispatch(setLoading(false));

        // Optionally redirect to login
        // router.push('/login');
      }
    }
  }, [authLoading, isAuthenticated, loadPitchDraft]);

  // Save to localStorage whenever formData changes
  useEffect(() => {
    const dataToSave = {
      formData,
      activeTab,
      completedSteps,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [formData, activeTab, completedSteps]);

  // Auto-save function
  const performAutoSave = useCallback(
    async (step: PitchTab, data: Record<string, unknown>) => {
      // Don't auto-save if user is not authenticated
      if (!isAuthenticated) return;

      setIsAutoSavingLocal(true);
      dispatch(setAutoSaving(true));

      try {
        const response = await pitchService.autoSavePitch(step, data);
        if (response.success) {
          dispatch(setAutoSaved());
        } else {
          throw new Error(response.message || "Auto-save failed");
        }
      } catch (error) {
        // Don't show error toast for auto-save failures to avoid spamming user
        console.error("Auto-save failed:", error);
      } finally {
        setIsAutoSavingLocal(false);
        dispatch(setAutoSaving(false));
      }
    },
    [dispatch, isAuthenticated]
  );

  // Auto-save when data is dirty
  useEffect(() => {
    if (
      autoSaveState.isDirty &&
      !isLoading &&
      !isSubmitting &&
      isAuthenticated
    ) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const stepData = getStepData(activeTab);
          if (stepData && Object.keys(stepData).length > 0) {
            await performAutoSave(activeTab, stepData);
          }
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }, AUTO_SAVE_DELAY);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    autoSaveState.isDirty,
    activeTab,
    performAutoSave,
    isLoading,
    isSubmitting,
    isAuthenticated,
  ]);

  // Handle tab changes
  const handleTabChange = useCallback(
    (tab: PitchTab) => {
      dispatch(setActiveTab(tab));
      dispatch(clearAllErrors());
    },
    [dispatch]
  );

  // Update step data
  const handleStepDataUpdate = useCallback(
    (step: PitchTab, data: Record<string, unknown>) => {
      dispatch(updateStepData({ step, data }));
      dispatch(setDirty(true));
    },
    [dispatch]
  );

  // Submit step
  const handleStepSubmit = useCallback(
    async (step: PitchTab, data: StepFormData) => {
      // Check authentication before submitting
      if (!isAuthenticated) {
        handleError("Please log in to save your pitch");
        router.push("/login");
        return;
      }

      setIsStepSubmitting(true);
      dispatch(setSubmitting(true));
      dispatch(setError(null));

      try {
        let response;

        switch (step) {
          case "company-info":
            response = await pitchService.updateCompanyInfo(
              data as CompanyInfoFormData
            );
            break;
          case "pitch-deal":
            response = await pitchService.updatePitchDeal(
              data as PitchDealFormData
            );
            break;
          case "team":
            response = await pitchService.updateTeam(data as TeamFormData);
            break;
          case "media":
            response = await pitchService.updateMedia(data as MediaFormData);
            break;
          case "documents":
            response = await pitchService.updateDocuments(
              data as DocumentsFormData
            );
            break;
          case "packages":
            response = await pitchService.updatePackage(
              data as PackagesFormData
            );
            break;
          default:
            throw new Error("Invalid step");
        }

        if (response.success) {
          // Update completed steps
          dispatch(markStepCompleted(step));

          // Update form data in Redux
          dispatch(updateStepData({ step, data }));

          handleSuccess(response.message || "Step saved successfully");

          // Auto-advance to next step after successful submission
          const tabOrder: PitchTab[] = [
            "company-info",
            "pitch-deal",
            "team",
            "media",
            "documents",
            "packages",
          ];

          const currentIndex = tabOrder.indexOf(step);
          if (currentIndex < tabOrder.length - 1) {
            setTimeout(() => {
              handleTabChange(tabOrder[currentIndex + 1]);
            }, 1000);
          } else {
            // Final submission completed
            handleSuccess("Pitch submitted successfully!");
            setTimeout(() => {
              router.push("/enterpreneur/dashboard?tab=my-pitches");
            }, 1500);
          }
        } else {
          throw new Error(response.message || "Failed to save step");
        }
      } catch (err) {
        const errorMessage = handleError(err, "Failed to save step");
        dispatch(setError(errorMessage));
        throw err;
      } finally {
        setIsStepSubmitting(false);
        dispatch(setSubmitting(false));
      }
    },
    [
      dispatch,
      handleTabChange,
      router,
      isAuthenticated,
      handleError,
      handleSuccess,
    ]
  );

  // Get data for specific step
  const getStepData = useCallback(
    (step: PitchTab) => {
      switch (step) {
        case "company-info":
          return formData.companyInfo;
        case "pitch-deal":
          return formData.pitchDeal;
        case "team":
          return formData.team;
        case "media":
          return formData.media;
        case "documents":
          return formData.documents;
        case "packages":
          return formData.packages;
        default:
          return {};
      }
    },
    [formData]
  );

  // Check if step is completed
  const isStepCompleted = useCallback(
    (step: PitchTab) => {
      return completedSteps.includes(step);
    },
    [completedSteps]
  );

  // Check if step is accessible
  const isStepAccessible = useCallback(
    (step: PitchTab) => {
      const tabOrder: PitchTab[] = [
        "company-info",
        "pitch-deal",
        "team",
        "media",
        "documents",
        "packages",
      ];

      const activeIndex = tabOrder.indexOf(activeTab);
      const stepIndex = tabOrder.indexOf(step);

      // Current tab and previous tabs are always accessible
      if (stepIndex <= activeIndex) return true;

      // Next tab is accessible if current tab has data
      if (stepIndex === activeIndex + 1) return true;

      return false;
    },
    [activeTab]
  );

  // Save draft manually
  const saveDraft = useCallback(async () => {
    if (!autoSaveState.isDirty || !isAuthenticated) return;

    try {
      const stepData = getStepData(activeTab);
      if (stepData && Object.keys(stepData).length > 0) {
        await performAutoSave(activeTab, stepData);
        handleSuccess("Draft saved successfully");
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
      handleError(err, "Failed to save draft");
    }
  }, [
    autoSaveState.isDirty,
    activeTab,
    performAutoSave,
    getStepData,
    isAuthenticated,
    handleError,
    handleSuccess,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (autoSaveState.isDirty && isAuthenticated) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        saveDraft();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [autoSaveState.isDirty, saveDraft, isAuthenticated]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && autoSaveState.isDirty && isAuthenticated) {
        saveDraft();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoSaveState.isDirty, saveDraft, isAuthenticated]);

  return {
    // State
    formData,
    activeTab,
    completedSteps,
    progress,
    lastSaved,
    error,

    // Authentication state
    isAuthenticated,
    authLoading,

    // Loading states
    isLoading: isLoading || isDraftLoading || authLoading,
    isSubmitting: isSubmitting || isStepSubmitting,
    isAutoSaving: autoSaveState.isAutoSaving || isAutoSavingLocal,
    isDirty: autoSaveState.isDirty,

    // Actions
    handleTabChange,
    handleStepDataUpdate,
    handleStepSubmit,
    saveDraft,
    loadPitchDraft,

    // Getters
    getStepData,
    isStepCompleted,
    isStepAccessible,
  };
};
