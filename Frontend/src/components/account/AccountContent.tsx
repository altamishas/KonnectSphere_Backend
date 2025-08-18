// File: components/account/AccountContent.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import AccountSidebar from "@/components/account/Sidebar";
import AccountTabBar from "@/components/account/Tabbar";
import ContactInfoTab from "@/components/account/ContactInfo";
import ProfileInfoTab from "@/components/account/ProfileInfo";
import PasswordTab from "@/components/account/PasswordTab";

import IdealInvestmentTab from "@/components/account/IdealInvestment";
import DeleteAccountTab from "@/components/account/DeleteAccount";
import PaymentsTab from "@/components/account/PaymentsTab";
import { useAppSelector } from "@/hooks/hooks";

// Import subscription components
import { SubscriptionIndicator } from "@/components/subscription/SubscriptionIndicator";
import { SubscriptionBanner } from "@/components/subscription/SubscriptionBanner";

// Import the type
import type { AccountTab } from "@/components/account/Tabbar";

interface AccountContentProps {
  containerClassName?: string;
  showLoader?: boolean;
  redirectTo?: string;
}

export default function AccountContent({
  containerClassName = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10",
  showLoader = true,
}: AccountContentProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<AccountTab>("contact-info");
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Ensure user is authenticated, redirect if not

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Display a loading state until we confirm user is authenticated
  if (showLoader && (!isAuthenticated || !user)) {
    return (
      <div className={containerClassName}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Loading your profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isInvestor = user?.role === "Investor";

  return (
    <div className={containerClassName}>
      {/* Subscription Status Banner */}
      <div className="mb-6">
        <SubscriptionBanner showDetails={true} />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {!isMobile ? (
          <AccountSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        ) : (
          <AccountTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        <div className="flex-1">
          {/* Subscription Status Indicator */}
          <div className="mb-4 flex justify-end">
            <SubscriptionIndicator variant="full" />
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as AccountTab)}
            orientation="vertical"
            className="w-full"
          >
            <TabsContent value="contact-info" className="mt-0 space-y-6">
              <ContactInfoTab key={`contact-info-${user?._id}`} />
            </TabsContent>
            {isInvestor && (
              <TabsContent value="profile-info" className="mt-0 space-y-6">
                <ProfileInfoTab key={`profile-info-${user?._id}`} />
              </TabsContent>
            )}
            <TabsContent value="password" className="mt-0 space-y-6">
              <PasswordTab />
            </TabsContent>

            {isInvestor && (
              <TabsContent value="ideal-investment" className="mt-0 space-y-6">
                <IdealInvestmentTab key={`ideal-investment-${user?._id}`} />
              </TabsContent>
            )}
            <TabsContent value="payments" className="mt-0 space-y-6">
              <PaymentsTab key={`payments-${user?._id}`} />
            </TabsContent>
            <TabsContent value="delete-account" className="mt-0 space-y-6">
              <DeleteAccountTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
