"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export const useDashboardTab = (defaultTab: string) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const changeTab = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    router.replace(url.toString(), { scroll: false });
  };

  return { activeTab, changeTab };
};
