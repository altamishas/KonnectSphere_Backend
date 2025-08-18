import {
  Building,
  FileText,
  Users,
  Image as ImageIcon,
  FileArchive,
  Package,
} from "lucide-react";
import type { PitchTab } from "@/app/(landing)/add-pitch/page";

interface PitchSidebarProps {
  activeTab: PitchTab;
  onTabChange: (tab: PitchTab) => void;
  completedTabs?: string[];
}

const PitchSidebar = ({
  activeTab,
  onTabChange,
  completedTabs = [],
}: PitchSidebarProps) => {
  // Map completed tabs to tab completion state
  const getTabCompletion = (tab: PitchTab): boolean => {
    const tabMap = {
      "company-info": "companyInfo",
      "pitch-deal": "pitchDeal",
      team: "team",
      media: "media",
      documents: "documents",
      packages: "packages",
    };
    return completedTabs.includes(tabMap[tab]);
  };

  // Check if a tab is accessible
  const isTabAccessible = (tab: PitchTab): boolean => {
    const tabOrder: PitchTab[] = [
      "company-info",
      "pitch-deal",
      "team",
      "media",
      "documents",
      "packages",
    ];

    const activeIndex = tabOrder.indexOf(activeTab);
    const tabIndex = tabOrder.indexOf(tab);

    // Current tab and previous tabs are always accessible
    if (tabIndex <= activeIndex) return true;

    // The next tab is accessible if the previous tab is completed
    if (tabIndex === activeIndex + 1) return true;

    return false;
  };

  // Get the appropriate icon for a tab
  const getTabIcon = (tab: PitchTab) => {
    switch (tab) {
      case "company-info":
        return <Building className="h-5 w-5" />;
      case "pitch-deal":
        return <FileText className="h-5 w-5" />;
      case "team":
        return <Users className="h-5 w-5" />;
      case "media":
        return <ImageIcon className="h-5 w-5" />;
      case "documents":
        return <FileArchive className="h-5 w-5" />;
      case "packages":
        return <Package className="h-5 w-5" />;
      default:
        return <Building className="h-5 w-5" />;
    }
  };

  // Get the label for a tab
  const getTabLabel = (tab: PitchTab): string => {
    switch (tab) {
      case "company-info":
        return "Company Info";
      case "pitch-deal":
        return "Pitch & Deal";
      case "team":
        return "Team";
      case "media":
        return "Media";
      case "documents":
        return "Documents";
      case "packages":
        return "Packages";
      default:
        return "";
    }
  };

  // Get the completion status indicator
  const getStatusIndicator = (tab: PitchTab) => {
    if (tab === activeTab) {
      return (
        <span className="h-6 w-6 rounded-full bg-white text-[#1e2537] flex items-center justify-center text-xs font-semibold">
          {getTabNumber(tab)}
        </span>
      );
    }

    if (getTabCompletion(tab)) {
      return (
        <span className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      );
    }

    return (
      <span
        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold
        ${
          isTabAccessible(tab)
            ? "bg-slate-700 text-white"
            : "bg-slate-600/50 text-slate-400"
        }
      `}
      >
        {getTabNumber(tab)}
      </span>
    );
  };

  // Get the number for a tab
  const getTabNumber = (tab: PitchTab): number => {
    const tabOrder: PitchTab[] = [
      "company-info",
      "pitch-deal",
      "team",
      "media",
      "documents",
      "packages",
    ];
    return tabOrder.indexOf(tab) + 1;
  };

  // All possible tabs
  const tabs: PitchTab[] = [
    "company-info",
    "pitch-deal",
    "team",
    "media",
    "documents",
    "packages",
  ];

  return (
    <div className="h-full py-8 flex flex-col">
      <div className="px-6 mb-10">
        <h1 className="text-2xl font-bold text-white">Create Pitch</h1>
        <p className="text-slate-400 text-sm mt-1">
          Complete all sections to publish
        </p>
      </div>

      <nav className="flex-grow">
        <ul className="space-y-1 px-3">
          {tabs.map((tab) => (
            <li key={tab}>
              <button
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition
                  ${
                    tab === activeTab
                      ? "bg-white/10 text-white"
                      : isTabAccessible(tab)
                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                      : "text-slate-500 cursor-not-allowed"
                  }
                `}
                onClick={() => isTabAccessible(tab) && onTabChange(tab)}
                disabled={!isTabAccessible(tab)}
              >
                {getStatusIndicator(tab)}
                <span className="flex items-center space-x-3 flex-grow">
                  <span className="flex-shrink-0">{getTabIcon(tab)}</span>
                  <span>{getTabLabel(tab)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-6 mt-6">
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">Need help?</h3>
          <p className="text-slate-400 text-sm mb-3">
            Our team is available to assist you in creating a compelling pitch.
          </p>
          <button className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-md text-sm transition">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default PitchSidebar;
