import React from "react";
import {
  LightbulbIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

interface ContextualHelpProps {
  context: string;
}

interface HelpItem {
  title: string;
  description: string;
}

const ContextualHelp = ({ context }: ContextualHelpProps) => {
  // Default help content
  const defaultContent: HelpItem[] = [
    {
      title: "Creating your pitch",
      description:
        "Fill out each section of your pitch to attract potential investors. Be clear, concise, and compelling in your descriptions.",
    },
    {
      title: "Quality matters",
      description:
        "High-quality information increases your chances of investment. Provide detailed, accurate data about your business and plans.",
    },
    {
      title: "Set your progress",
      description:
        "You can save your progress at any time and come back later. Complete all sections before publishing your pitch to investors.",
    },
  ];

  // Context-specific help content
  const getContextualHelp = (): HelpItem[] => {
    switch (context) {
      case "pitch-title":
        return [
          {
            title: "Creating a compelling title",
            description:
              "Your pitch title should be concise, memorable, and clearly convey your value proposition. Aim for 5-10 words that capture what makes your business unique.",
          },
          {
            title: "Examples of great titles",
            description:
              "• 'AI-Powered Healthcare Diagnostics Platform'\n• 'Sustainable Fashion from Recycled Materials'\n• 'Next-Gen Supply Chain Management Solution'",
          },
        ];
      case "website-url":
        return [
          {
            title: "Website requirements",
            description:
              "Provide your company's primary website URL. Make sure it's professional, functional, and showcases your products or services.",
          },
          {
            title: "Tips for better websites",
            description:
              "• Ensure your website is mobile-responsive\n• Include clear contact information\n• Showcase your team and product\n• Highlight any traction or social proof",
          },
        ];
      case "industry-selection":
        return [
          {
            title: "Choosing the right industry",
            description:
              "Select the industry that best represents your business. If your company spans multiple industries, choose the primary one first, then add a secondary industry if needed.",
          },
          {
            title: "Why this matters",
            description:
              "The industries you select will help investors who specialize in those fields find your pitch. It also affects which analytics and market comparisons are applied to your business.",
          },
        ];
      case "country":
        return [
          {
            title: "Selecting your country",
            description:
              "Pick the country where your company is registered or primarily operates. This helps investors understand legal and market context.",
          },
          {
            title: "Tips",
            description:
              "If you operate in multiple countries, choose your HQ location and clarify other markets in your Market section.",
          },
        ];
      case "phone-number":
        return [
          {
            title: "Professional contact number",
            description:
              "Provide a reachable business phone with country code. Example: +1 555 123 4567.",
          },
          {
            title: "Best practices",
            description:
              "Use a number monitored during business hours; avoid personal numbers if possible.",
          },
        ];
      case "stage":
        return [
          {
            title: "Choose your company stage",
            description:
              "Investors assess risk by stage. Pick the option that best matches your maturity (e.g., MVP, Achieving Sales, Profitable).",
          },
          {
            title: "Guidance",
            description:
              "If between stages, select the closest match and explain details in Progress/Proof.",
          },
        ];
      case "ideal-investor-role":
        return [
          {
            title: "Ideal investor involvement",
            description:
              "Specify how hands-on you expect investors to be (daily, weekly, monthly, or any).",
          },
          {
            title: "Why it matters",
            description:
              "This sets expectations and helps match you with compatible investors.",
          },
        ];
      case "funding-amount":
        return [
          {
            title: "Setting your funding goal",
            description:
              "Be realistic about how much funding you need. Investors look for well-thought-out funding requirements that align with your growth plans and milestones.",
          },
          {
            title: "How to calculate",
            description:
              "Your funding amount should cover:\n• Operating expenses for 12-18 months\n• Key hires and team expansion\n• Product development and improvements\n• Marketing and customer acquisition\n• Buffer for unexpected expenses (10-15%)",
          },
        ];
      case "minimum-investment":
        return [
          {
            title: "Setting minimum investment",
            description:
              "The minimum investment amount determines the lowest contribution an investor can make. Consider your funding structure and investor expectations.",
          },
          {
            title: "Typical ranges",
            description:
              "• Early-stage: $10,000 - $25,000\n• Growth stage: $25,000 - $100,000\n• Late stage: $100,000+\n\nLower minimums attract more investors but increase administrative overhead.",
          },
        ];
      case "business-summary":
        return [
          {
            title: "Writing an effective summary",
            description:
              "Your business summary should clearly explain what your company does, the problem it solves, and why it's poised for success. Keep it concise and compelling.",
          },
          {
            title: "Key elements to include",
            description:
              "• The problem you're solving\n• Your unique solution\n• Target market and size\n• Business model\n• Competitive advantage\n• Traction and milestones achieved\n• Why now is the right time for investment",
          },
        ];
      case "financials":
        return [
          {
            title: "Financials: turnover and profit",
            description:
              "Provide historical or projected figures per year. Be realistic and consistent across years.",
          },
          {
            title: "What to include",
            description:
              "Revenue (turnover), profit/loss, and the year. Use the same currency across entries.",
          },
        ];
      case "team-members":
        return [
          {
            title: "Showcasing your team",
            description:
              "Investors often say they invest in people first, ideas second. Highlight the expertise, experience, and unique qualifications that make your team capable of executing your business plan.",
          },
          {
            title: "What to include",
            description:
              "• Relevant experience and achievements\n• Education and credentials\n• Previous startups or exits\n• Industry expertise\n• How the team complements each other\n• Key advisors or board members",
          },
        ];
      case "logo-upload":
        return [
          {
            title: "Logo best practices",
            description:
              "Your logo is a key part of your brand identity. Upload a high-quality, professional logo that represents your company well.",
          },
          {
            title: "Technical requirements",
            description:
              "• Recommended size: 300x300 pixels minimum\n• Format: PNG or SVG with transparent background\n• Keep it simple and recognizable at small sizes\n• Ensure it looks good in both light and dark modes",
          },
        ];
      case "banner-upload":
        return [
          {
            title: "Banner image",
            description:
              "Upload a wide banner (e.g., 1200x400). Use a clean visual that represents your brand.",
          },
          {
            title: "Tips",
            description:
              "Avoid heavy text on the banner; ensure it looks good in light and dark modes.",
          },
        ];
      case "youtube-video":
        return [
          {
            title: "YouTube pitch video",
            description:
              "Paste a public or unlisted YouTube URL. Keep the video concise (1–3 minutes) and impactful.",
          },
          {
            title: "Content guidance",
            description:
              "Explain the problem, solution, traction, and why now. Include a clear call to action.",
          },
        ];
      case "upload-video":
        return [
          {
            title: "Upload a video",
            description:
              "Upload MP4/MOV up to 50MB. Ensure good lighting and clear audio for a professional impression.",
          },
        ];
      case "documents-pitchdeck":
        return [
          {
            title: "Pitch deck",
            description:
              "10–15 slides covering problem, solution, market, business model, traction, team, and financials.",
          },
        ];
      case "documents-businessplan":
        return [
          {
            title: "Business plan",
            description:
              "Comprehensive strategy document. Include go-to-market, operations, competition, and milestones.",
          },
        ];
      case "documents-executivesummary":
        return [
          {
            title: "Executive summary",
            description:
              "1–2 page overview highlighting the most important points of your business plan.",
          },
        ];
      case "documents-financials":
        return [
          {
            title: "Financial projections",
            description:
              "3–5 year projections with assumptions. Include revenue, costs, cash flow, and funding usage.",
          },
        ];
      case "documents-upload":
        return [
          {
            title: "Important documents",
            description:
              "Quality documentation demonstrates your professionalism and preparedness to investors. Focus on organized, well-presented materials.",
          },
          {
            title: "Document checklist",
            description:
              "• Pitch deck (10-15 slides)\n• Business plan\n• Financial projections (3-5 years)\n• Market research\n• Product roadmap\n• Legal documents (incorporation, IP, etc.)\n• Team resumes or CVs",
          },
        ];
      case "packages-selection":
        return [
          {
            title: "Select a subscription package",
            description:
              "Choose the plan that unlocks the features you need. Basic allows 1 published pitch; Premium increases limits and visibility.",
          },
          {
            title: "Recommendation",
            description:
              "If you plan multiple published pitches or need global visibility, pick Premium.",
          },
        ];
      case "tags":
        return [
          {
            title: "Tags & keywords",
            description:
              "Add up to 10 searchable tags that describe your business, industry, and technology (e.g., AI, Fintech, SaaS).",
          },
        ];
      case "financials":
        return [
          {
            title: "Financial information",
            description:
              "Accurate financial data is crucial for investor decision-making. Be honest and realistic with your numbers and projections.",
          },
          {
            title: "What investors are looking for",
            description:
              "• Historical performance (if available)\n• Realistic growth projections\n• Clear revenue streams\n• Thoughtful expense planning\n• Path to profitability\n• Unit economics\n• Key financial milestones",
          },
        ];
      default:
        return defaultContent;
    }
  };

  const helpContent = getContextualHelp();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <LightbulbIcon className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Help & Tips
        </h2>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Complete all sections to maximize your chances of connecting with the
          right investors.
        </p>
      </div>

      <div className="space-y-4">
        {helpContent.map((item, index) => (
          <div
            key={index}
            className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
          >
            <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center">
                <BookOpenIcon className="h-4 w-4 text-primary mr-2" />
                <h3 className="font-medium text-slate-900 dark:text-white">
                  {item.title}
                </h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {context && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing tips for: {context.replace(/-/g, " ")}
            </span>
            <button
              onClick={() =>
                document
                  .getElementById("help-section")
                  ?.scrollTo({ top: 0, behavior: "smooth" })
              }
              className="text-xs text-primary hover:text-primary/80 dark:text-primary-light dark:hover:text-primary-light/80"
            >
              Back to top
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">
          Do&apos;s and Don&apos;ts
        </h3>

        <div className="flex items-start space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Be specific about your business model, market opportunity, and how
            you&apos;ll use the funds.
          </p>
        </div>

        <div className="flex items-start space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Demonstrate traction and progress with metrics, milestones, and
            achievements.
          </p>
        </div>

        <div className="flex items-start space-x-2">
          <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Don&apos;t exaggerate or make unrealistic claims about your market
            size or projections.
          </p>
        </div>

        <div className="flex items-start space-x-2">
          <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Don&apos;t use technical jargon without explanation — make your
            pitch accessible to all investors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextualHelp;
