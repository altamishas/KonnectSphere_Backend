"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { authService } from "@/services/auth-service";
import {
  accountDeletionStart,
  accountDeletionSuccess,
  accountDeletionFail,
  unsubscribeStart,
  unsubscribeSuccess,
  unsubscribeFail,
  resubscribeStart,
  resubscribeSuccess,
  resubscribeFail,
  logoutSuccess,
} from "@/store/slices/auth-slice";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { toast } from "sonner";

export default function DeleteAccountTab() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { mutate: deleteAccount, isPending: isDeletingAccount } = useMutation({
    mutationFn: (data: { password: string }) => {
      dispatch(accountDeletionStart());
      return authService.deleteAccount(data);
    },
    onSuccess: (response) => {
      if (response?.message === "User deleted successfully") {
        dispatch(accountDeletionSuccess());
        dispatch(logoutSuccess());
        setShowDeleteDialog(false);
        setPassword("");
        toast.success("Your account has been successfully deleted.");

        // Force a complete page reload to ensure all state is cleared
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        dispatch(accountDeletionFail("Unexpected response"));
        toast.error("Unexpected response from server.");
      }
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      const message =
        error?.response?.data?.message ||
        "Failed to delete account. Please try again.";
      dispatch(accountDeletionFail(message));
      toast.error(message);

      if (message.includes("password")) {
        setPasswordError(message);
      }
    },
  });

  const { mutate: unsubscribeAccount, isPending: isUnsubscribing } =
    useMutation({
      mutationFn: () => {
        dispatch(unsubscribeStart());
        return authService.unsubscribeAccount();
      },
      onSuccess: (response) => {
        if (response?.message === "User unsubscribed successfully") {
          dispatch(unsubscribeSuccess());
          dispatch(logoutSuccess());
          toast.success(
            "You have been unsubscribed successfully. Your data is now hidden."
          );

          // Force a complete page reload to ensure all state is cleared
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          dispatch(unsubscribeFail("Unexpected response"));
          toast.error("Unexpected response from server.");
        }
      },
      onError: (
        error: Error & { response?: { data?: { message?: string } } }
      ) => {
        const message =
          error?.response?.data?.message ||
          "Failed to unsubscribe. Please try again.";
        dispatch(unsubscribeFail(message));
        toast.error(message);
      },
    });

  const { mutate: resubscribeAccount, isPending: isResubscribing } =
    useMutation({
      mutationFn: () => {
        dispatch(resubscribeStart());
        return authService.resubscribeAccount();
      },
      onSuccess: (response) => {
        if (response?.message === "User resubscribed successfully") {
          dispatch(resubscribeSuccess());
          toast.success("Welcome back! Your data is now visible again.");
          // Refresh the page to update the UI
          window.location.reload();
        } else {
          dispatch(resubscribeFail("Unexpected response"));
          toast.error("Unexpected response from server.");
        }
      },
      onError: (
        error: Error & { response?: { data?: { message?: string } } }
      ) => {
        const message =
          error?.response?.data?.message ||
          "Failed to resubscribe. Please try again.";
        dispatch(resubscribeFail(message));
        toast.error(message);
      },
    });

  const handleUnsubscribe = () => {
    unsubscribeAccount();
  };

  const handleResubscribe = () => {
    resubscribeAccount();
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setPassword("");
    setPasswordError("");
  };

  const handleDeleteConfirm = () => {
    if (!password.trim()) {
      setPasswordError("Password is required to delete your account");
      return;
    }

    setPasswordError("");
    deleteAccount({ password: password.trim() });
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setPassword("");
    setPasswordError("");
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  // Show different content based on subscription status
  if (user?.isUnsubscribed) {
    return (
      <>
        <h2 className="text-2xl font-bold mb-6 text-orange-600">
          Account Unsubscribed
        </h2>

        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              Your Account is Hidden
            </h3>
            <p className="text-muted-foreground mb-6">
              Your account and pitches are currently hidden from other users.
            </p>
          </div>

          <Alert className="border-border bg-muted">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <p className="mb-4">
                Your account is currently unsubscribed, which means:
              </p>
              <ul className="list-disc list-inside space-y-2 mb-4">
                <li>Your pitches are hidden from other users</li>
                <li>You won&apos;t appear in investor searches</li>
                <li>Your data is preserved and secure</li>
                <li>You can reactivate anytime</li>
              </ul>
              <p className="mb-4">
                <strong>Ready to get back in the game?</strong> Resubscribe to
                make your profile and pitches visible again.
              </p>
            </AlertDescription>
          </Alert>

          <div className="text-center">
            <p className="text-sm font-medium mb-6">
              Choose what you&apos;d like to do:
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="default"
                onClick={handleResubscribe}
                disabled={isResubscribing}
                className="min-w-[200px] bg-green-600 hover:bg-green-700"
              >
                {isResubscribing
                  ? "Resubscribing..."
                  : "Resubscribe & Show My Data"}
              </Button>

              <Button
                variant="destructive"
                onClick={handleDeleteClick}
                disabled={isDeletingAccount}
                className="min-w-[200px]"
              >
                {isDeletingAccount
                  ? "Deleting..."
                  : "Permanently Delete Account"}
              </Button>

              <Button
                variant="outline"
                onClick={handleBackToDashboard}
                className="min-w-[200px]"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-6 text-destructive">
        Delete Account
      </h2>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">Leaving So Soon?</h3>
          <p className="text-muted-foreground mb-6">
            We&apos;re genuinely sorry to see you go.
          </p>
        </div>

        <Alert className="border-border bg-muted">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            <p className="mb-4">
              At <strong>KonnectSphere</strong>, every account represents a
              world of opportunity — a dream taking shape, a partnership waiting
              to happen, a future ready to be built. By deleting your account,
              you&apos;re choosing to step away from a global network of
              innovators, visionaries, and changemakers.
            </p>
            <p className="mb-4">
              <strong>
                Before you make your final decision, consider what you&apos;re
                leaving behind:
              </strong>
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                A growing international network of entrepreneurs and investors
              </li>
              <li>
                The chance to discover groundbreaking ideas or fund the next big
                success
              </li>
              <li>Opportunities that evolve with every connection you make</li>
            </ul>
            <p className="mb-4">
              <strong>
                Your journey, your ideas, your potential — they matter here.
              </strong>
            </p>
            <p className="mb-4">
              This isn&apos;t just an account. It&apos;s a platform built to
              help shape your future.
            </p>
            <p>
              If you&apos;re not ready to leave for good, you can simply{" "}
              <strong>unsubscribe</strong> and pause your activity. You&apos;ll{" "}
              <strong>keep your data and connections intact</strong> for when
              you&apos;re ready to return.
            </p>
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <p className="text-sm font-medium mb-6">
            Choose what works best for you:
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleUnsubscribe}
              disabled={isUnsubscribing}
              className="min-w-[200px]"
            >
              {isUnsubscribing
                ? "Unsubscribing..."
                : "Unsubscribe & Keep Account"}
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isDeletingAccount}
              className="min-w-[200px]"
            >
              {isDeletingAccount
                ? "Deleting..."
                : "Continue to Delete My Account"}
            </Button>

            <Button
              variant="default"
              onClick={handleBackToDashboard}
              className="min-w-[200px]"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={handleDeleteCancel}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please enter your password to
              confirm permanent account deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Enter your password"
                className={passwordError ? "border-destructive" : ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleDeleteConfirm();
                  }
                }}
              />
            </div>
            {passwordError && (
              <Alert className="border-destructive">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-destructive">
                  {passwordError}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeletingAccount || !password.trim()}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
