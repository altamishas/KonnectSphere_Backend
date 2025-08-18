# KonnectSphere - Subscription-Based Feature Access

## Overview

This system implements subscription-based feature access for entrepreneurs, providing different levels of functionality based on their subscription plan (Basic vs Premium).

## Subscription Plans

### Basic Plan Features

- **Pitch Limit**: 1 business pitch
- **Visibility**: Pitch visible only in selected country/region
- **Investor Access**: Access to investor network within the same region only
- **Documents**: No document upload capability

### Premium Plan Features

- **Pitch Limit**: Up to 5 business pitches
- **Visibility**: Pitch visible across all countries (global visibility)
- **Search Priority**: Featured at the top of global search results
- **Documents**: Full document upload capability (business plan, financials, pitch deck, etc.)
- **Investor Access**: Access to international investors globally
- **Engagement**: Higher chance of visibility and engagement

## Implementation

### Middleware

- `subscriptionAccessControl.ts` - Main middleware for handling subscription restrictions
- Key functions:
  - `checkPitchLimit()` - Enforces pitch publishing limits
  - `checkDocumentAccess()` - Restricts document uploads to Premium users
  - `getUserSubscriptionRestrictions()` - Returns user's plan restrictions

### Controllers Updated

- **Pitch Controller**: Added pitch limit enforcement and subscription tracking
- **Investor Controller**: Added region-based filtering for Basic users
- **Subscription Controller**: Added new endpoint for subscription status

### Routes Protected

- `PUT /api/pitch/package` - Now checks pitch limits before publishing
- `PUT /api/pitch/documents` - Now requires Premium plan for document uploads
- `GET /api/subscription/status` - New endpoint for subscription status with pitch usage

### Features Implemented

#### 1. Pitch Limit Enforcement

- Basic users can only publish 1 pitch
- Premium users can publish up to 5 pitches
- Automatic counter tracking in UserSubscription model
- Proper error handling with upgrade prompts

#### 2. Country/Region-Based Visibility

- Basic plan pitches only visible in same country
- Premium plan pitches visible globally
- Anonymous users only see Premium pitches
- Featured pitches prioritize Premium users

#### 3. Investor Access Control

- Basic entrepreneurs see only regional investors
- Premium entrepreneurs see all global investors
- Filtering applied in investor search results

#### 4. Document Upload Restrictions

- Document uploads blocked for Basic plan users
- Premium users have full document access
- Clear error messages directing users to upgrade

#### 5. Search Result Prioritization

- Premium pitches appear first in search results
- Recently published Premium pitches get top priority
- Basic pitches sorted by publication date within country

## API Endpoints

### New Endpoints

```
GET /api/subscription/status - Get subscription status with pitch usage
DELETE /api/pitch/:pitchId - Delete pitch (updates subscription counter)
```

### Modified Endpoints

```
PUT /api/pitch/package - Now enforces pitch limits
PUT /api/pitch/documents - Now requires Premium for uploads
GET /api/pitch/published - Now filters by subscription rules
GET /api/pitch/featured - Now prioritizes Premium pitches
GET /api/investor/search - Now filters by region for Basic users
```

## Database Updates

### UserSubscription Model

- `pitchesUsed` field tracks published pitch count
- Automatically incremented on publish, decremented on delete

### Subscription Plan Configuration

```typescript
"Basic": {
  pitchLimit: 1,
  globalVisibility: false,
  documentsAllowed: false,
  investorAccessGlobal: false,
  featuredInSearch: false,
},
"Premium": {
  pitchLimit: 5,
  globalVisibility: true,
  documentsAllowed: true,
  investorAccessGlobal: true,
  featuredInSearch: true,
}
```

## Usage Examples

### Check User's Subscription Status

```javascript
const response = await fetch("/api/subscription/status");
const { pitchUsage, features } = response.data;
// pitchUsage: { published: 1, limit: 5, remaining: 4, canAddMore: true }
// features: { globalVisibility: true, documentsAllowed: true, ... }
```

### Publishing a Pitch (with limits)

```javascript
// Middleware automatically checks if user can publish another pitch
const response = await fetch("/api/pitch/package", {
  method: "PUT",
  body: { selectedPackage: "premium", agreeToTerms: true },
});
// Returns 403 if pitch limit exceeded
```

## Error Handling

The system provides clear error messages for subscription limitations:

- "You have reached your pitch limit of 1 for your Basic plan. Please upgrade to publish more pitches."
- "Document uploads are only available for Premium plan subscribers. Please upgrade your plan to upload documents."

## Future Enhancements

1. Real-time subscription status updates
2. Usage analytics and reporting
3. Automated subscription renewal handling
4. Additional premium features (priority support, advanced analytics)
5. Granular geographic targeting options
