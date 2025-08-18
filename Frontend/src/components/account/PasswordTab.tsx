// File: app/account/components/PasswordTab.tsx

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

import { authService } from "@/services/auth-service";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import {
  passwordChangeFail,
  passwordChangeStart,
  passwordChangeSuccess,
} from "@/store/slices/auth-slice";
import { toast } from "sonner";
// -------------------------
// Zod Schema & Types
// -------------------------
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include at least one uppercase letter")
      .regex(/[0-9]/, "Must include at least one number")
      .regex(/[^a-zA-Z0-9]/, "Must include at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function PasswordTab() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);

  const onSubmit = async (data: PasswordFormData) => {
    try {
      dispatch(passwordChangeStart());
      const res = await authService.changePassword(data);
      toast.success(res.message); // Optional: show toast
      dispatch(passwordChangeSuccess());
      reset();
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      const message =
        error?.response?.data?.message || "Failed to change password.";
      toast.error(message);
      dispatch(passwordChangeFail(message));
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Change Password</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-sm text-red-500">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="bg-muted/30 rounded-lg p-4 mt-4">
          <h3 className="font-medium mb-2">Password Requirements:</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-[#d9c579] mr-2" />
              Minimum 8 characters long
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-[#d9c579] mr-2" />
              At least one uppercase letter
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-[#d9c579] mr-2" />
              At least one number
            </li>
            <li className="flex items-center">
              <CheckCircle2 className="h-4 w-4 text-[#d9c579] mr-2" />
              At least one special character
            </li>
          </ul>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" type="button" onClick={() => reset()}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-[#d9c579] hover:bg-[#c8b66c] text-black"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Password"}
          </Button>
        </div>
      </form>
    </>
  );
}
