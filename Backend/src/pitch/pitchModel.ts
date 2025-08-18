import mongoose, { Schema, Document } from "mongoose";

// Team Member interface
interface ITeamMember {
  name: string;
  role: string;
  bio: string;
  linkedinUrl?: string;
  profileImage?: {
    public_id: string;
    url: string;
  };
  experience: string;
  skills: string[];
}

// Media interface
interface IMedia {
  logo?: {
    public_id: string;
    url: string;
  };
  banner?: {
    public_id: string;
    url: string;
  };
  images: {
    public_id: string;
    url: string;
  }[];
  videoType: "youtube" | "upload";
  youtubeUrl?: string;
  uploadedVideo?: {
    public_id: string;
    url: string;
  };
}

// Document interface
interface IDocument {
  businessPlan?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  financials?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  pitchDeck?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  executiveSummary?: {
    public_id: string;
    url: string;
    originalName: string;
  };
  additionalDocuments: {
    public_id: string;
    url: string;
    originalName: string;
  }[];
}

// Main Pitch interface
export interface IPitch extends Document {
  userId: mongoose.Types.ObjectId;

  // Company Information
  companyInfo: {
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
  };

  // Pitch Deal Details
  pitchDeal: {
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
  };

  // Team
  team: {
    members: ITeamMember[];
  };

  // Media
  media: IMedia;

  // Documents
  documents: IDocument;

  // Package
  package: {
    selectedPackage: string;
    agreeToTerms: boolean;
  };

  // Meta information
  status: "draft" | "submitted" | "published" | "rejected";
  completedSteps: string[];
  isActive: boolean;
  publishedAt?: Date;
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// Team Member Schema
const teamMemberSchema = new Schema<ITeamMember>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  bio: { type: String, required: true },
  linkedinUrl: { type: String },
  profileImage: {
    public_id: { type: String },
    url: { type: String },
  },
  experience: { type: String, required: true },
  skills: [{ type: String }],
});

// Media Schema
const mediaSchema = new Schema<IMedia>({
  logo: {
    public_id: { type: String },
    url: { type: String },
  },
  banner: {
    public_id: { type: String },
    url: { type: String },
  },
  images: [
    {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
    },
  ],
  videoType: { type: String, enum: ["youtube", "upload"], default: "youtube" },
  youtubeUrl: { type: String },
  uploadedVideo: {
    public_id: { type: String },
    url: { type: String },
  },
});

// Document Schema
const documentSchema = new Schema<IDocument>({
  businessPlan: {
    public_id: { type: String },
    url: { type: String },
    originalName: { type: String },
  },
  financials: {
    public_id: { type: String },
    url: { type: String },
    originalName: { type: String },
  },
  pitchDeck: {
    public_id: { type: String },
    url: { type: String },
    originalName: { type: String },
  },
  executiveSummary: {
    public_id: { type: String },
    url: { type: String },
    originalName: { type: String },
  },
  additionalDocuments: [
    {
      public_id: { type: String, required: true },
      url: { type: String, required: true },
      originalName: { type: String, required: true },
    },
  ],
});

// Main Pitch Schema
const pitchSchema = new Schema<IPitch>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    companyInfo: {
      pitchTitle: { type: String },
      website: { type: String },
      country: { type: String },
      phoneNumber: { type: String },
      industry1: { type: String },
      industry2: { type: String },
      stage: { type: String },
      idealInvestorRole: { type: String },
      previousRaised: { type: String },
      raisingAmount: { type: String },
      raisedSoFar: { type: String },
      minimumInvestment: { type: String },
    },

    pitchDeal: {
      summary: { type: String },
      business: { type: String },
      market: { type: String },
      progress: { type: String },
      objectives: { type: String },
      highlights: [
        {
          title: { type: String },
          icon: { type: String },
        },
      ],
      dealType: {
        type: String,
        enum: ["equity", "loan"],
        default: "equity",
      },
      financials: [
        {
          year: { type: String },
          turnover: { type: String },
          profit: { type: String },
        },
      ],
      tags: [{ type: String }],
    },

    team: {
      members: [teamMemberSchema],
    },

    media: mediaSchema,

    documents: documentSchema,

    package: {
      selectedPackage: { type: String },
      agreeToTerms: { type: Boolean },
    },

    status: {
      type: String,
      enum: ["draft", "submitted", "published", "rejected"],
      default: "draft",
    },

    completedSteps: [{ type: String }],
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
pitchSchema.index({ userId: 1 });
pitchSchema.index({ status: 1 });
pitchSchema.index({ "companyInfo.industry1": 1 });
pitchSchema.index({ "companyInfo.stage": 1 });
pitchSchema.index({ createdAt: -1 });

export default mongoose.model<IPitch>("Pitch", pitchSchema);
