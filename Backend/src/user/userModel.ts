import mongoose from "mongoose";

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["Entrepreneur", "Investor"],
      required: true,
      default: "Entrepreneur",
    },

    subscriptionPlan: {
      type: String,
      enum: ["Free", "Basic", "Premium", "Investor Access Plan"],
      default: "Free",
    },

    agreedToTerms: {
      type: Boolean,
      required: true,
      default: false,
    },

    isAccreditedInvestor: {
      type: Boolean,
      default: false, // Only for Investors, checked if they certify as accredited
    },
    avatarImage: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    bannerImage: {
      public_id: {
        type: String,
        required: false,
      },
      url: {
        type: String,
        required: false,
      },
    },
    countryName: String,
    cityName: String,
    phoneNumber: String,
    mobileNumber: String,
    bio: String,

    // Investor profile completion status
    isInvestorProfileComplete: {
      type: Boolean,
      default: false, // Will be set to true for entrepreneurs during registration
    },

    // Investment preferences for ideal investment tab (consolidates min/max investment)
    investmentPreferences: {
      investmentRangeMin: {
        type: Number,
        default: 1000,
      },
      investmentRangeMax: {
        type: Number,
        default: 100000,
      },
      maxInvestmentsPerYear: {
        type: Number,
        default: 1,
      },
      interestedLocations: [String],
      interestedIndustries: [String],
      investmentStages: [String], // Added investment stages field
      pitchCountries: [String],
      languages: [String],
      additionalCriteria: String,
    },

    // Profile info for investor profile tab (consolidates aboutMe, previousInvestments, etc.)
    profileInfo: {
      // Social Media Links
      linkedinUrl: String,
      instagramUrl: String,
      facebookUrl: String,
      twitterUrl: String,
      skypeId: String,
      personalWebsite: String,

      // Profile Information (replaces professionalBackground)
      aboutMe: String,
      specializedField: String,
      previousInvestments: {
        type: Number,
        default: 0,
      },
      areasOfExpertise: [String], // Added here to consolidate

      // Companies
      companies: [
        {
          id: String,
          logoUrl: String,
          companyName: String,
          position: String,
          description: String,
          website: String,
          logo: {
            public_id: String,
            url: String,
          },
        },
      ],
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: {
      type: String,
      default: null,
    },
    emailVerificationOTPExpires: {
      type: Date,
      default: Date.now,
      required: false,
    },
    isUnsubscribed: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
  },

  { timestamps: true }
);

// Create and export the model
const User = mongoose.model("User", userSchema);
export default User;
