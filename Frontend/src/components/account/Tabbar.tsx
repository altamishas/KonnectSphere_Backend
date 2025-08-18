// File: app/account/components/AccountTabBar.tsx
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Lock,
  Trash,
  TrendingUp,
  UserCircle,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/hooks/hooks";

// 1. Define allowed tab types
export type AccountTab =
  | "contact-info"
  | "profile-info"
  | "password"
  | "ideal-investment"
  | "payments"
  | "delete-account";

// 2. Define component props using the tab type
interface AccountTabBarProps {
  activeTab: AccountTab;
  setActiveTab: (tab: AccountTab) => void;
}

export default function AccountTabBar({
  activeTab,
  setActiveTab,
}: AccountTabBarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const isInvestor = user?.role === "Investor";

  return (
    <div className="w-full mb-6 overflow-x-auto">
      <Tabs
        defaultValue="contact-info"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as AccountTab)} // safe cast
      >
        <TabsList className="flex w-full justify-between bg-gradient-to-r from-secondary/30 to-secondary/50 dark:from-secondary/10 dark:to-secondary/20 p-1 border border-secondary/30 dark:border-secondary/20">
          <TabsTrigger
            value="contact-info"
            className={cn(
              "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
              "hover:bg-primary/10 dark:hover:bg-primary/20",
              activeTab === "contact-info"
                ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                : "text-secondary-foreground/80 dark:text-secondary-foreground/60"
            )}
            onClick={() => setActiveTab("contact-info")}
          >
            <User className="h-4 w-4 mb-1" />
            <span className="text-xs">Contact</span>
          </TabsTrigger>

          {isInvestor && (
            <TabsTrigger
              value="profile-info"
              className={cn(
                "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
                "hover:bg-primary/10 dark:hover:bg-primary/20",
                activeTab === "profile-info"
                  ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                  : "text-secondary-foreground/80 dark:text-secondary-foreground/60"
              )}
              onClick={() => setActiveTab("profile-info")}
            >
              <UserCircle className="h-4 w-4 mb-1" />
              <span className="text-xs">Profile</span>
            </TabsTrigger>
          )}

          <TabsTrigger
            value="password"
            className={cn(
              "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
              "hover:bg-primary/10 dark:hover:bg-primary/20",
              activeTab === "password"
                ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                : "text-secondary-foreground/80 dark:text-secondary-foreground/60"
            )}
            onClick={() => setActiveTab("password")}
          >
            <Lock className="h-4 w-4 mb-1" />
            <span className="text-xs">Password</span>
          </TabsTrigger>

          {isInvestor && (
            <TabsTrigger
              value="ideal-investment"
              className={cn(
                "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
                "hover:bg-primary/10 dark:hover:bg-primary/20",
                activeTab === "ideal-investment"
                  ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                  : "text-secondary-foreground/80 dark:text-secondary-foreground/60"
              )}
              onClick={() => setActiveTab("ideal-investment")}
            >
              <TrendingUp className="h-4 w-4 mb-1" />
              <span className="text-xs">Investment</span>
            </TabsTrigger>
          )}

          <TabsTrigger
            value="payments"
            className={cn(
              "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
              "hover:bg-primary/10 dark:hover:bg-primary/20",
              activeTab === "payments"
                ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                : "text-secondary-foreground/80 dark:text-secondary-foreground/60"
            )}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard className="h-4 w-4 mb-1" />
            <span className="text-xs">Payments</span>
          </TabsTrigger>

          <TabsTrigger
            value="delete-account"
            className={cn(
              "flex flex-col items-center py-2 px-1 min-w-[60px] transition-all duration-200 rounded-md",
              "hover:bg-destructive/10 dark:hover:bg-destructive/20",
              activeTab === "delete-account"
                ? "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-lg hover:from-red-600 hover:to-red-700"
                : "text-destructive/80 dark:text-destructive/60"
            )}
            onClick={() => setActiveTab("delete-account")}
          >
            <Trash className="h-4 w-4 mb-1" />
            <span className="text-xs">Delete</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
