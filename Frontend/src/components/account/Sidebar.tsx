// File: app/account/components/AccountSidebar.tsx

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  Lock,
  Trash,
  TrendingUp,
  UserCircle,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountTab } from "./Tabbar";
import { useAppSelector } from "@/hooks/hooks";

// 2. Define props with strict types
interface AccountSidebarProps {
  activeTab: AccountTab;
  setActiveTab: (tab: AccountTab) => void;
}

// 3. Typed Component
export default function AccountSidebar({
  activeTab,
  setActiveTab,
}: AccountSidebarProps) {
  const { user } = useAppSelector((state) => state.auth);
  const isInvestor = user?.role === "Investor";

  return (
    <div className="w-full md:w-64 md:flex-shrink-0 mb-6 md:mb-0">
      <Card className="sticky top-20  bg-gradient-to-br from-secondary/20 to-secondary/40 dark:from-secondary/5 dark:to-secondary/10 shadow-lg border border-secondary/30 dark:border-secondary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
          <CardTitle className="text-xl bg-gradient-to-r from-primary to-amber-600 bg-clip-text text-transparent">
            Account Settings
          </CardTitle>
          <CardDescription className="text-secondary-foreground/70 dark:text-secondary-foreground/50">
            Manage your profile and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <Tabs>
            <TabsList className="flex flex-col items-stretch h-auto space-y-1 bg-transparent">
              <TabsTrigger
                value="contact-info"
                className={cn(
                  "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                  "hover:bg-primary/10 dark:hover:bg-primary/20",
                  activeTab === "contact-info"
                    ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                    : "text-secondary-foreground/80 dark:text-secondary-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                )}
                onClick={() => setActiveTab("contact-info")}
              >
                <User className="h-4 w-4 mr-2" />
                Contact Info
              </TabsTrigger>

              {isInvestor && (
                <TabsTrigger
                  value="profile-info"
                  className={cn(
                    "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                    "hover:bg-primary/10 dark:hover:bg-primary/20",
                    activeTab === "profile-info"
                      ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                      : "text-secondary-foreground/80 dark:text-secondary-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  )}
                  onClick={() => setActiveTab("profile-info")}
                >
                  <UserCircle className="h-4 w-4 mr-2" />
                  Profile Info
                </TabsTrigger>
              )}

              <TabsTrigger
                value="password"
                className={cn(
                  "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                  "hover:bg-primary/10 dark:hover:bg-primary/20",
                  activeTab === "password"
                    ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                    : "text-secondary-foreground/80 dark:text-secondary-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                )}
                onClick={() => setActiveTab("password")}
              >
                <Lock className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>

              {isInvestor && (
                <TabsTrigger
                  value="ideal-investment"
                  className={cn(
                    "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                    "hover:bg-primary/10 dark:hover:bg-primary/20",
                    activeTab === "ideal-investment"
                      ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                      : "text-secondary-foreground/80 dark:text-secondary-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  )}
                  onClick={() => setActiveTab("ideal-investment")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Ideal Investment
                </TabsTrigger>
              )}

              <TabsTrigger
                value="payments"
                className={cn(
                  "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                  "hover:bg-primary/10 dark:hover:bg-primary/20",
                  activeTab === "payments"
                    ? "bg-gradient-to-r from-primary to-amber-600 text-primary-foreground shadow-lg hover:from-amber-600 hover:to-orange-600"
                    : "text-secondary-foreground/80 dark:text-secondary-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                )}
                onClick={() => setActiveTab("payments")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>

              <TabsTrigger
                value="delete-account"
                className={cn(
                  "justify-start px-3 py-3 h-auto rounded-lg transition-all duration-200",
                  "hover:bg-destructive/10 dark:hover:bg-destructive/20",
                  activeTab === "delete-account"
                    ? "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground shadow-lg hover:from-red-600 hover:to-red-700"
                    : "text-destructive/80 dark:text-destructive/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                )}
                onClick={() => setActiveTab("delete-account")}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Account
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
