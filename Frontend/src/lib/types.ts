export interface NavigationItem {
  title: string;
  href: string;
  icon: string;
  submenu?: { title: string; href: string; icon: string }[];
}
export interface PitchCardProps {
  id: string;
  title: string;
  company: string;
  description: string;
  industry: string;
  image: string;
  fundingGoal: number;
  fundingCurrent: number;
  investors: number;
  daysLeft: number;
}
export interface InvestorCardProps {
  id: string;
  name: string;
  avatar: string;
  location: string;
  bio: string;
  industries: string[];
  investmentRange: string;
  totalInvestments: number;
  verified: boolean;
}

//========================Investor Search Types=========
export interface Industry {
  id: string;
  name: string;
  count?: number;
}

export interface IndustryWithIcon {
  name: string;
  iconName: string;
  description: string;
  color: string;
}

export interface Location {
  id: string;
  name: string;
  count?: number;
}

export interface InvestmentStage {
  id: string;
  name: string;
  count?: number;
}

export interface Investor {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  location: string;
  bio: string;
  interests: {
    id: string;
    name: string;
  }[];
  investmentRange: string;
  pastInvestments: number;
  averageInvestment: number;
  connections: number;
  isStarred?: boolean;
  verified?: boolean;
}

export interface InvestorFilterState {
  query?: string;
  investmentRange: [number, number];
  countries: string[];
  industries: string[];
  stages: string[];
}

export interface InvestorSearchResponse {
  investors: Investor[];
  total: number;
  page: number;
  limit: number;
}
export interface Testimonial {
  id: number;
  quote: string;
  name: string;
  title: string;
  company: string;
  avatar: string;
  rating: number;
  type: "entrepreneur" | "investor";
}
export interface Plan {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: {
    text: string;
    tooltip?: string;
    included: boolean;
  }[];
  highlighted?: boolean;
  badge?: string;
}
//========================Authentiication related Types=========
export interface User {
  _id: string;
  id?: string; // For compatibility
  fullName: string;
  email: string;
  password?: string; // Typically omitted from frontend, but add if needed in backend use
  role: "Entrepreneur" | "Investor";
  subscriptionPlan:
    | "Basic"
    | "Premium"
    | "Investor Access Plan"
    | "basic"
    | "premium";
  stripeCustomerId?: string;
  agreedToTerms: boolean;
  isAccreditedInvestor?: boolean;
  isEmailVerified: boolean;
  isInvestorProfileComplete: boolean;
  isUnsubscribed?: boolean;

  avatarImage?: {
    public_id?: string;
    url?: string;
  };

  bannerImage?: {
    public_id?: string;
    url?: string;
  };

  countryName?: string;
  cityName?: string;
  phoneNumber?: string;
  mobileNumber?: string;
  bio?: string;

  // Investor-specific fields
  professionalBackground?: string;
  areasOfExpertise?: string[];
  investmentRange?: {
    min: number;
    max: number;
  };
  preferredIndustries?: string[];

  pastInvestments?: number;
  linkedinUrl?: string;
  website?: string;

  // Investment preferences for ideal investment tab
  investmentPreferences?: {
    investmentRangeMin: number;
    investmentRangeMax: number;
    maxInvestmentsPerYear: number;
    interestedLocations: string[];
    interestedIndustries: string[];
    pitchCountries: string[];
    languages: string[];
    additionalCriteria?: string;
    investmentStages?: string[];
  };

  // Profile info for investor profile tab
  profileInfo?: {
    linkedinUrl?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    skypeId?: string;
    personalWebsite?: string;
    aboutMe?: string;
    specializedField?: string;
    previousInvestments?: number;
    areasOfExpertise?: string[];
    companies?: {
      id?: string;
      logoUrl?: string;
      companyName?: string;
      position?: string;
      description?: string;
      website?: string;
      logo?: {
        public_id?: string;
        url?: string;
      };
    }[];
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationPending: boolean;
  verificationUserId: string | null;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: "Entrepreneur" | "Investor";
  subscriptionPlan?:
    | "Basic"
    | "Premium"
    | "Investor Access Plan"
    | "basic"
    | "premium";
  agreedToTerms: boolean;
  isAccreditedInvestor?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
  userId?: string;
}
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

//========================Pitch Form Types=========
// Tab types
export type PitchTab =
  | "company-info"
  | "pitch-deal"
  | "team"
  | "media"
  | "documents"
  | "packages";

export interface PitchTabInfo {
  id: string;
  label: string;
  completed: boolean;
}

// Company Information Form Types
export interface CompanyInfoFormData {
  pitchTitle: string;
  website: string;
  country: string;
  phoneNumber: string;
  industry1: string;
  industry2?: string;
  stage: string;
  idealInvestorRole: string;
  previousRaised?: string;
  raisingAmount: string;
  raisedSoFar?: string;
  minimumInvestment: string;
}

// Pitch Deal Form Types
export interface PitchDealFormData {
  summary: string;
  business: string;
  market: string;
  progress: string;
  objectives: string;
  highlights: {
    title: string;
    icon: string;
  }[];
  dealType: "equity" | "loan";
  financials: {
    year: string;
    turnover: string;
    profit: string;
  }[];
  tags: string[];
}

// Team Member Types
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  profileImage?: {
    public_id: string;
    url: string;
    originalName?: string;
  };
  profileImageFile?: File; // For file upload
  experience: string;
  skills: string[];
}

export interface TeamFormData {
  members: TeamMember[];
}

// Media Form Types
export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadProgress: number;
}

export interface MediaFormData {
  logo?: {
    public_id: string;
    url: string;
    originalName?: string;
  };
  logoFile?: File; // For file upload
  currentLogo?: {
    public_id: string;
    url: string;
    originalName?: string;
  }; // For deletion during edit
  banner?: {
    public_id: string;
    url: string;
    originalName?: string;
  };
  bannerFile?: File; // For file upload
  currentBanner?: {
    public_id: string;
    url: string;
    originalName?: string;
  }; // For deletion during edit
  images: {
    public_id: string;
    url: string;
    originalName?: string;
  }[];
  imageFiles?: File[]; // For file upload
  videoType: "youtube" | "upload";
  youtubeUrl?: string;
  uploadedVideo?: {
    public_id: string;
    url: string;
    originalName?: string;
  };
  uploadedVideoFile?: File; // For file upload
  currentUploadedVideo?: {
    public_id: string;
    url: string;
    originalName?: string;
  }; // For deletion during edit
}

// Document Types
export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadProgress: number;
  url: string;
  uploadedAt?: Date;
}

export interface DocumentsFormData {
  businessPlan?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  businessPlanFile?: File; // For file upload
  financials?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  financialsFile?: File; // For file upload
  pitchDeck?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  pitchDeckFile?: File; // For file upload
  executiveSummary?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  executiveSummaryFile?: File; // For file upload
  additionalDocuments: {
    public_id: string;
    url: string;
    originalName: string;
  }[];
  additionalDocumentFiles?: File[]; // For file upload
}

// Package Types
export interface Package {
  id: string;
  name: string;
  price: number;
  duration: number; // in days
  features: string[];
  description: string;
  highlighted?: boolean;
  badge?: string;
}

export interface PitchPackage {
  selectedPackage: string;
  agreeToTerms: boolean;
  paymentMethod?: string;
  packageDuration?: number;
  packagePrice?: number;
}

export interface PackagesFormData {
  selectedPackage: string;
  agreeToTerms: boolean;
  paymentMethod?: string;
  packageDuration?: number;
  packagePrice?: number;
}

// Combined Pitch Data
export interface PitchData {
  companyInfo: CompanyInfoFormData;
  pitchDeal: PitchDealFormData;
  team: TeamFormData;
  media: MediaFormData;
  documents: DocumentsFormData;
  package: PitchPackage;
  status: "draft" | "submitted" | "published";
  createdAt: Date;
  updatedAt: Date;
}

// Form Component Props
export interface FormComponentProps<T = Record<string, unknown>> {
  onSubmit: (data: T) => void;
  onHelpContextChange: (context: string) => void;
  onChange?: (data: T) => void;
  initialData?: Partial<T>;
}

// Upload Types
export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
  progress?: number;
}

export interface UploadOptions {
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  multiple?: boolean;
}

// Help Context Types
export interface HelpContext {
  title: string;
  description: string;
  tips: string[];
  examples?: string[];
}

// Error Types
export interface FormError {
  field: string;
  message: string;
  code?: string;
}
