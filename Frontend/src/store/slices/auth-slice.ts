import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, User } from "@/lib/types";

const initialState: AuthState = {
  user: null,
  token: null, // not used anymore
  isAuthenticated: false,
  isLoading: true,
  error: null,
  verificationPending: false,
  verificationUserId: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    authSuccess: (state, action: PayloadAction<{ user?: User }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user || null;
      state.isLoading = false;
      state.error = null;
    },
    authFail: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
      state.error = action.payload;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    logoutSuccess: (state) => {
      Object.assign(state, {
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: null,
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    passwordChangeStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    passwordChangeSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    passwordChangeFail: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    accountDeletionStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    accountDeletionSuccess: (state) => {
      // Reset the auth state completely (same as logout)
      Object.assign(state, {
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: null,
      });
    },
    accountDeletionFail: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    unsubscribeStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    unsubscribeSuccess: (state) => {
      // Reset the auth state completely (same as logout)
      Object.assign(state, {
        user: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
        error: null,
      });
    },
    unsubscribeFail: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    resubscribeStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    resubscribeSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
      // Update user's unsubscribed status
      if (state.user) {
        state.user.isUnsubscribed = false;
      }
    },
    resubscribeFail: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setVerificationPending: (state, action: PayloadAction<string>) => {
      state.verificationPending = true;
      state.verificationUserId = action.payload;
    },
    clearVerificationPending: (state) => {
      state.verificationPending = false;
      state.verificationUserId = null;
    },
  },
});

export const {
  authStart,
  authSuccess,
  authFail,
  setUser,
  logoutSuccess,
  clearError,
  passwordChangeStart,
  passwordChangeSuccess,
  passwordChangeFail,
  accountDeletionStart,
  accountDeletionSuccess,
  accountDeletionFail,
  unsubscribeStart,
  unsubscribeSuccess,
  unsubscribeFail,
  resubscribeStart,
  resubscribeSuccess,
  resubscribeFail,
  setVerificationPending,
  clearVerificationPending,
} = authSlice.actions;

export default authSlice.reducer;
