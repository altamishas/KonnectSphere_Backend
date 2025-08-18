// Type definitions for viewing pitch data (matches backend IPitch interface)

export interface PitchResponse {
  success: boolean;
  message: string;
  data: ViewPitchData;
  restricted?: boolean;
  accessLevel?: "full" | "overview-only";
}

export interface PitchMediaFile {
  public_id: string;
  url: string;
}

export interface PitchDocument {
  public_id: string;
  url: string;
  originalName: string;
}

export interface PitchTeamMember {
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  profileImage?: PitchMediaFile;
  experience: string;
  skills: string[];
}

export interface PitchHighlight {
  title: string;
  icon: string;
}

export interface PitchFinancial {
  year: string;
  turnover: string;
  profit: string;
}

export interface PitchCompanyInfo {
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

export interface PitchDealInfo {
  summary: string;
  business: string;
  market: string;
  progress: string;
  objectives: string;
  highlights: PitchHighlight[];
  dealType: "equity" | "loan";
  financials: PitchFinancial[];
  tags: string[];
}

export interface PitchMedia {
  logo?: PitchMediaFile;
  banner?: PitchMediaFile;
  images: PitchMediaFile[];
  videoType: "youtube" | "upload";
  youtubeUrl?: string;
  uploadedVideo?: PitchMediaFile;
}

export interface PitchDocuments {
  businessPlan?: PitchDocument;
  financials?: PitchDocument;
  pitchDeck?: PitchDocument;
  executiveSummary?: PitchDocument;
  additionalDocuments: PitchDocument[];
}

export interface PitchTeam {
  members: PitchTeamMember[];
}

export interface PitchPackage {
  selectedPackage: string;
  agreeToTerms: boolean;
  paymentMethod?: string;
  packageDuration?: number;
  packagePrice?: number;
}

export interface PitchUser {
  _id: string;
  fullName: string;
  email: string;
  avatarImage?: PitchMediaFile;
  phoneNumber?: string;
}

export interface ViewPitchData {
  _id: string;
  userId: PitchUser;
  companyInfo: PitchCompanyInfo;
  pitchDeal: PitchDealInfo;
  team: PitchTeam;
  media: PitchMedia;
  documents: PitchDocuments;
  package: PitchPackage;
  status: "draft" | "submitted" | "published" | "rejected";
  completedSteps: string[];
  isActive: boolean;
  publishedAt?: string;
  industry1: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}
