import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth-slice";
import pitchReducer from "./slices/pitch-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pitch: pitchReducer,
    // Add other reducers here
  },
  devTools: process.env.NODE_ENV !== "production",
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
