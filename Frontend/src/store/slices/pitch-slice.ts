import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  CompanyInfoFormData,
  PitchDealFormData,
  TeamFormData,
  MediaFormData,
  DocumentsFormData,
  PackagesFormData,
  PitchTab,
} from "@/lib/types";

// Enhanced pitch form data interface
interface PitchFormData {
  companyInfo: Partial<CompanyInfoFormData>;
  pitchDeal: Partial<PitchDealFormData>;
  team: Partial<TeamFormData>;
  media: Partial<MediaFormData>;
  documents: Partial<DocumentsFormData>;
  packages: Partial<PackagesFormData>;
}

// Union type for step data
type StepFormData =
  | Partial<CompanyInfoFormData>
  | Partial<PitchDealFormData>
  | Partial<TeamFormData>
  | Partial<MediaFormData>
  | Partial<DocumentsFormData>
  | Partial<PackagesFormData>;

// Auto-save status
interface AutoSaveState {
  isAutoSaving: boolean;
  lastAutoSaved: string | null;
  isDirty: boolean;
}

// Pitch state interface
interface PitchState {
  // Form data
  formData: PitchFormData;

  // UI state
  activeTab: PitchTab;
  completedSteps: string[];

  // Loading states
  isSubmitting: boolean;
  isLoading: boolean;

  // Auto-save state
  autoSave: AutoSaveState;

  // Error handling
  error: string | null;
  stepErrors: Record<string, string[]>;

  // Progress tracking
  progress: number;

  // Draft management
  draftId: string | null;
  lastSaved: string | null;
}

// Initial state
const initialState: PitchState = {
  formData: {
    companyInfo: {},
    pitchDeal: {
      highlights: [],
      financials: [],
      tags: [],
    },
    team: {
      members: [],
    },
    media: {
      images: [],
      videoType: "youtube",
    },
    documents: {
      additionalDocuments: [],
    },
    packages: {},
  },
  activeTab: "company-info",
  completedSteps: [],
  isSubmitting: false,
  isLoading: false,
  autoSave: {
    isAutoSaving: false,
    lastAutoSaved: null,
    isDirty: false,
  },
  error: null,
  stepErrors: {},
  progress: 0,
  draftId: null,
  lastSaved: null,
};

// Pitch slice
const pitchSlice = createSlice({
  name: "pitch",
  initialState,
  reducers: {
    // Tab navigation
    setActiveTab: (state, action: PayloadAction<PitchTab>) => {
      state.activeTab = action.payload;
    },

    // Form data updates
    updateStepData: (
      state,
      action: PayloadAction<{
        step: PitchTab;
        data: StepFormData;
      }>
    ) => {
      const { step, data } = action.payload;
      const stepKey =
        step === "company-info"
          ? "companyInfo"
          : step === "pitch-deal"
          ? "pitchDeal"
          : step === "packages"
          ? "packages"
          : step;

      // Helper function to remove File objects from data
      const sanitizeData = (obj: unknown): unknown => {
        if (obj === null || obj === undefined) return obj;
        if (obj instanceof File) return undefined; // Exclude File objects
        if (Array.isArray(obj)) {
          return obj.map(sanitizeData).filter((item) => item !== undefined);
        }
        if (typeof obj === "object") {
          const sanitized: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(
            obj as Record<string, unknown>
          )) {
            if (key.includes("File")) continue; // Skip file properties
            const sanitizedValue = sanitizeData(value);
            if (sanitizedValue !== undefined) {
              sanitized[key] = sanitizedValue;
            }
          }
          return sanitized;
        }
        return obj;
      };

      const sanitizedData = sanitizeData(data) as Partial<
        Record<string, unknown>
      >;

      (state.formData[stepKey as keyof PitchFormData] as Record<
        string,
        unknown
      >) = {
        ...(state.formData[stepKey as keyof PitchFormData] as Record<
          string,
          unknown
        >),
        ...sanitizedData,
      };

      // Mark as dirty for auto-save
      state.autoSave.isDirty = true;

      // Clear step errors when data is updated
      delete state.stepErrors[step];
    },

    // Step completion
    markStepCompleted: (state, action: PayloadAction<string>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
      state.progress = (state.completedSteps.length / 6) * 100;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    // Auto-save states
    setAutoSaving: (state, action: PayloadAction<boolean>) => {
      state.autoSave.isAutoSaving = action.payload;
    },

    setAutoSaved: (state) => {
      state.autoSave.lastAutoSaved = new Date().toISOString();
      state.autoSave.isDirty = false;
    },

    setDirty: (state, action: PayloadAction<boolean>) => {
      state.autoSave.isDirty = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setStepErrors: (
      state,
      action: PayloadAction<{ step: string; errors: string[] }>
    ) => {
      state.stepErrors[action.payload.step] = action.payload.errors;
    },

    clearStepErrors: (state, action: PayloadAction<string>) => {
      delete state.stepErrors[action.payload];
    },

    clearAllErrors: (state) => {
      state.error = null;
      state.stepErrors = {};
    },

    // Draft management
    setDraftId: (state, action: PayloadAction<string | null>) => {
      state.draftId = action.payload;
    },

    setLastSaved: (state, action: PayloadAction<string | null>) => {
      state.lastSaved = action.payload;
    },

    // Load complete pitch data
    loadPitchData: (
      state,
      action: PayloadAction<{
        formData: PitchFormData;
        completedSteps: string[];
        draftId: string;
        lastSaved: string;
      }>
    ) => {
      const { formData, completedSteps, draftId, lastSaved } = action.payload;
      state.formData = formData;
      state.completedSteps = completedSteps;
      state.progress = (completedSteps.length / 6) * 100;
      state.draftId = draftId;
      state.lastSaved = lastSaved;
      state.autoSave.isDirty = false;
    },

    // Reset pitch state
    resetPitchState: () => initialState,

    // Initialize from localStorage
    initializeFromStorage: (
      state,
      action: PayloadAction<Partial<PitchState>>
    ) => {
      Object.assign(state, { ...initialState, ...action.payload });
    },
  },
});

// Export actions
export const {
  setActiveTab,
  updateStepData,
  markStepCompleted,
  setLoading,
  setSubmitting,
  setAutoSaving,
  setAutoSaved,
  setDirty,
  setError,
  setStepErrors,
  clearStepErrors,
  clearAllErrors,
  setDraftId,
  setLastSaved,
  loadPitchData,
  resetPitchState,
  initializeFromStorage,
} = pitchSlice.actions;

// Selectors
export const selectPitchFormData = (state: { pitch: PitchState }) =>
  state.pitch.formData;
export const selectActiveTab = (state: { pitch: PitchState }) =>
  state.pitch.activeTab;
export const selectCompletedSteps = (state: { pitch: PitchState }) =>
  state.pitch.completedSteps;
export const selectIsLoading = (state: { pitch: PitchState }) =>
  state.pitch.isLoading;
export const selectIsSubmitting = (state: { pitch: PitchState }) =>
  state.pitch.isSubmitting;
export const selectAutoSaveState = (state: { pitch: PitchState }) =>
  state.pitch.autoSave;
export const selectError = (state: { pitch: PitchState }) => state.pitch.error;
export const selectStepErrors = (state: { pitch: PitchState }) =>
  state.pitch.stepErrors;
export const selectProgress = (state: { pitch: PitchState }) =>
  state.pitch.progress;
export const selectLastSaved = (state: { pitch: PitchState }) =>
  state.pitch.lastSaved;

// Export reducer
export default pitchSlice.reducer;
