"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lock, Mail, Shield } from "lucide-react";

interface EntrepreneurUpgradeMessageProps {
  isEntrepreneurRestriction?: boolean;
}

export const EntrepreneurUpgradeMessage = ({
  isEntrepreneurRestriction = false,
}: EntrepreneurUpgradeMessageProps) => {
  if (isEntrepreneurRestriction) {
    // Message for entrepreneurs viewing other entrepreneurs' pitches
    return (
      <div className="py-12 bg-slate-50 dark:bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Shield className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Protected Pitch Content
              </h3>

              <div className="max-w-2xl mx-auto">
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                  You can view the pitch overview above, but detailed sections
                  (team, documents, contact) are protected to prevent
                  unauthorized copying. Only the pitch owner and registered
                  investors can view the complete details.
                </p>

                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <Mail className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    To access full details, upgrade to an investor account at
                  </span>
                  <a
                    href="mailto:contact@konnectsphere.net"
                    className="text-orange-600 dark:text-orange-400 font-semibold hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                  >
                    contact@konnectsphere.net
                  </a>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  We protect entrepreneur intellectual property while
                  facilitating meaningful investor connections.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Original message for general upgrade requirement
  return (
    <div className="py-12 bg-slate-50 dark:bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Upgrade Required to View Full Pitch
            </h3>

            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                To view the full pitch you must be a registered investor. To
                upgrade to an investor account, please email
              </p>

              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <a
                  href="mailto:contact@konnectsphere.net"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  contact@konnectsphere.net
                </a>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Our team will help you about the details and connect with
                entrepreneurs.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
