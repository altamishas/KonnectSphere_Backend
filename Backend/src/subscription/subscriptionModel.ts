import mongoose, { Document, Schema } from "mongoose";

// Subscription Status Enum
export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  CANCELED = "canceled", // Stripe uses "canceled" (single 'l')
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  PAST_DUE = "past_due",
  TRIALING = "trialing",
  UNPAID = "unpaid",
  PAUSED = "paused",
}

// Interval choices for pricing
export enum IntervalChoices {
  MONTHLY = "month",
  YEARLY = "year",
}

export interface ISubscriptionBase {
  name: string;
  subtitle: string;
  userType: "entrepreneur" | "investor";
  pitchLimit: number;
  globalVisibility: boolean;
  features: string;
  permissions: string[];
  order: number;
  featured: boolean;
  active: boolean;
  stripeId?: string;
}

export interface ISubscription extends ISubscriptionBase, Document {
  _id: mongoose.Types.ObjectId;
  stripeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionPriceBase {
  subscription: mongoose.Types.ObjectId | ISubscription;
  interval: IntervalChoices;
  price: number;
  currency: string;
  featured: boolean;
  order: number;
  active: boolean;
  stripeId?: string;
}

export interface ISubscriptionPrice extends ISubscriptionPriceBase, Document {
  _id: mongoose.Types.ObjectId;
  stripeId?: string;
  createdAt: Date;
  updatedAt: Date;
  getStripePrice(): number;
}

export interface IUserSubscriptionBase {
  user: mongoose.Types.ObjectId;
  subscription: mongoose.Types.ObjectId | ISubscription;
  subscriptionPrice: mongoose.Types.ObjectId | ISubscriptionPrice;
  active: boolean;
  stripeId?: string;
  stripeCustomerId?: string;
  userCancelled: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  originalPeriodStart?: Date;
  status?: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  pitchesUsed: number;
  billingCycleAnchor?: Date;
}

export interface IUserSubscription extends IUserSubscriptionBase, Document {
  isActiveStatus(): boolean;
  getPlanName(): string | null;
  canAddPitch(): boolean;
  getRemainingPitches(): number;
  serialize(): {
    planName: string | null;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    pitchesUsed: number;
    pitchesRemaining: number;
    canAddPitch: boolean;
    cancelAtPeriodEnd: boolean;
  };
}

export interface IPaymentHistoryBase {
  user: mongoose.Types.ObjectId;
  userSubscription: mongoose.Types.ObjectId;
  stripeInvoiceId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: string;
  status:
    | "paid"
    | "pending"
    | "failed"
    | "cancelled"
    | "processing"
    | "requires_action";
  description: string;
  invoiceUrl?: string;
  paidAt?: Date;
  failedAt?: Date;
  dueDate?: Date;
  paymentType: "initial" | "recurring" | "retry";
  retryCount: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;
}

export interface IPaymentHistory extends IPaymentHistoryBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Base Subscription Plan Schema
const subscriptionSchema = new Schema<ISubscription>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ["entrepreneur", "investor"],
      required: true,
    },
    pitchLimit: {
      type: Number,
      required: true,
      default: 0,
    },
    globalVisibility: {
      type: Boolean,
      required: true,
      default: false,
    },
    features: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      required: true,
      default: ["basic"],
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    stripeId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Subscription Price Schema
const subscriptionPriceSchema = new Schema<ISubscriptionPrice>(
  {
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    interval: {
      type: String,
      enum: Object.values(IntervalChoices),
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "usd",
    },
    featured: {
      type: Boolean,
      required: true,
      default: false,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    stripeId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// User Subscription Schema
const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One subscription per user
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    subscriptionPrice: {
      type: Schema.Types.ObjectId,
      ref: "SubscriptionPrice",
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    stripeId: {
      type: String,
      maxlength: 100,
      unique: true,
      sparse: true,
    },
    stripeCustomerId: {
      type: String,
      maxlength: 100,
    },
    userCancelled: {
      type: Boolean,
      default: false,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    originalPeriodStart: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    pitchesUsed: {
      type: Number,
      default: 0,
    },
    billingCycleAnchor: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Payment History Schema
const paymentHistorySchema = new Schema<IPaymentHistory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userSubscription: {
      type: Schema.Types.ObjectId,
      ref: "UserSubscription",
      required: true,
    },
    stripeInvoiceId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "usd",
    },
    status: {
      type: String,
      enum: [
        "paid",
        "pending",
        "failed",
        "cancelled",
        "processing",
        "requires_action",
      ],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    invoiceUrl: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    paymentType: {
      type: String,
      enum: ["initial", "recurring", "retry"],
      default: "recurring",
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: {
      type: Date,
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Custom methods for UserSubscription
userSubscriptionSchema.methods.isActiveStatus = function (
  this: IUserSubscription
): boolean {
  const activeStatuses = [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.TRIALING,
  ];
  return activeStatuses.includes(this.status as SubscriptionStatus);
};

userSubscriptionSchema.methods.getPlanName = function (
  this: IUserSubscription
): string | null {
  if (!this.populated("subscription")) {
    return null;
  }
  return (this.subscription as ISubscription)?.name || null;
};

userSubscriptionSchema.methods.canAddPitch = function (
  this: IUserSubscription
): boolean {
  if (!this.populated("subscription")) {
    return false;
  }
  const subscription = this.subscription as ISubscription;
  return this.pitchesUsed < subscription.pitchLimit;
};

userSubscriptionSchema.methods.getRemainingPitches = function (
  this: IUserSubscription
): number {
  if (!this.populated("subscription")) {
    return 0;
  }
  const subscription = this.subscription as ISubscription;
  return Math.max(0, subscription.pitchLimit - this.pitchesUsed);
};

userSubscriptionSchema.methods.serialize = function (this: IUserSubscription) {
  return {
    planName: this.getPlanName(),
    status: this.status,
    currentPeriodStart: this.currentPeriodStart,
    currentPeriodEnd: this.currentPeriodEnd,
    pitchesUsed: this.pitchesUsed,
    pitchesRemaining: this.getRemainingPitches(),
    canAddPitch: this.canAddPitch(),
    cancelAtPeriodEnd: this.cancelAtPeriodEnd,
  };
};

// Automatically set originalPeriodStart
userSubscriptionSchema.pre("save", function (this: IUserSubscription, next) {
  if (!this.originalPeriodStart && this.currentPeriodStart) {
    this.originalPeriodStart = this.currentPeriodStart;
  }
  next();
});

// Method to get price in cents for Stripe
subscriptionPriceSchema.methods.getStripePrice = function (
  this: ISubscriptionPrice
): number {
  return Math.round(this.price * 100);
};

// Models
export const Subscription = mongoose.model<ISubscription>(
  "Subscription",
  subscriptionSchema
);
export const SubscriptionPrice = mongoose.model<ISubscriptionPrice>(
  "SubscriptionPrice",
  subscriptionPriceSchema
);
export const UserSubscription = mongoose.model<IUserSubscription>(
  "UserSubscription",
  userSubscriptionSchema
);
export const PaymentHistory = mongoose.model<IPaymentHistory>(
  "PaymentHistory",
  paymentHistorySchema
);

export default {
  Subscription,
  SubscriptionPrice,
  UserSubscription,
  PaymentHistory,
};
