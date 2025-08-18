"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useLogin } from "@/hooks/auth/useLogin"; // ← use the login hook
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleDollarSign, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { LucideIcon } from "@/components/ui-icons";
import { authService } from "@/services/auth-service";
import { setUser } from "@/store/slices/auth-slice";
import { AuthError } from "@/lib/types";
import { isValidRoute } from "@/lib/validRoutes";

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-slate-600">Loading...</span>
      </div>
    </div>
  );
}

// Main login form component that uses client hooks
function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate: loginMutation, isPending } = useLogin();
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const redirectTarget = (() => {
    if (!redirectParam) return "/";
    // Only allow same-site absolute paths and validate against known routes
    if (!redirectParam.startsWith("/")) return "/";
    const cleanPath = redirectParam.split("?")[0];
    return isValidRoute(cleanPath) ? redirectParam : "/";
  })();

  // If user somehow lands on login while already authenticated (CSR nav), honor redirect param
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectTarget);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Show error toast if registration fails
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    loginMutation(
      { email, password },
      {
        onSuccess: async () => {
          try {
            // Fetch complete user data after login
            const userData = await authService.getCurrentUser();
            dispatch(setUser(userData));
            router.replace(redirectTarget);
            toast.success("Login successful!");
          } catch (err) {
            const error = err as AuthError;
            toast.error(
              error.message || "Failed to fetch user data after login."
            );
          }
        },
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(45%_40%_at_50%_40%,rgba(217,197,121,0.1),transparent)]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <CircleDollarSign className="h-8 w-8 text-primary" />
            <span className="ml-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-500">
              KonnectSphere
            </span>
          </Link>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6 bg-card p-8 rounded-lg border border-border/60"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary hover:bg-[#c8b66c] text-black"
            type="submit"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <LucideIcon
                  name="Loader2"
                  className="mr-2 h-4 w-4 animate-spin"
                />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Dont have an account?</span>{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
