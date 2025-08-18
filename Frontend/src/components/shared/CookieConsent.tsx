"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type ConsentChoice = "all" | "essential" | "reject";

const CONSENT_COOKIE_NAME = "ks_consent";
const CONSENT_MAX_AGE_DAYS = 180; // ~6 months

function setCookie(name: string, value: string, maxAgeDays: number) {
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=")[1]) : null;
}

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [preference, setPreference] = useState<ConsentChoice>("essential");

  useEffect(() => {
    const consent = getCookie(CONSENT_COOKIE_NAME);
    if (!consent) {
      setIsOpen(true);
    }
  }, []);

  const saveConsent = (choice: ConsentChoice) => {
    setCookie(CONSENT_COOKIE_NAME, choice, CONSENT_MAX_AGE_DAYS);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl rounded-xl border bg-card text-foreground shadow-lg">
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-2">
            <h3 className="text-base md:text-lg font-semibold">
              We respect your privacy
            </h3>
            <p className="text-sm text-muted-foreground">
              KonnectSphere use cookies to ensure our website functions
              smoothly, analyze performance, enhance your browsing experience,
              and deliver the most relevant content. You can choose to accept
              all cookies, allow only essential ones, or reject non-essential
              cookies. Learn more in our{" "}
              <a href="/privacy-policy" className="underline text-accent">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end">
            <div className="flex gap-2 md:mr-auto">
              <Button
                variant="ghost"
                className="bg-primary text-white hover:bg-primary/90"
                onClick={() => setShowPrefs(true)}
              >
                Preferences
              </Button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="border-border hover:bg-secondary hover:text-black"
                onClick={() => saveConsent("reject")}
              >
                Reject All (keep essential)
              </Button>
              <Button
                variant="secondary"
                className="bg-secondary text-secondary-foreground hover:opacity-90"
                onClick={() => saveConsent("essential")}
              >
                Allow Essential Only
              </Button>
              <Button
                className="bg-primary text-primary-foreground hover:opacity-90"
                onClick={() => saveConsent("all")}
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPrefs} onOpenChange={setShowPrefs}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which categories of cookies you want to allow. You can
              change this later in site footer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="consent"
                value="essential"
                checked={preference === "essential"}
                onChange={() => setPreference("essential")}
                className="mt-1"
              />
              <span>
                <span className="font-medium">Essential only</span>
                <p className="text-sm text-muted-foreground">
                  Required for core functionality like authentication and
                  security.
                </p>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="consent"
                value="all"
                checked={preference === "all"}
                onChange={() => setPreference("all")}
                className="mt-1"
              />
              <span>
                <span className="font-medium">All cookies</span>
                <p className="text-sm text-muted-foreground">
                  Includes performance, analytics, and personalization.
                </p>
              </span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="radio"
                name="consent"
                value="reject"
                checked={preference === "reject"}
                onChange={() => setPreference("reject")}
                className="mt-1"
              />
              <span>
                <span className="font-medium">Reject non‑essential</span>
                <p className="text-sm text-muted-foreground">
                  Only essential cookies will be used.
                </p>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrefs(false)}>
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground"
              onClick={() => {
                setShowPrefs(false);
                saveConsent(preference);
              }}
            >
              Save preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
