import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, TrendingUp, BarChart3, Target } from "lucide-react";
import { ViewPitchData } from "@/lib/types/pitch-view";

interface PitchDetailsProps {
  pitch: ViewPitchData;
}

const PitchDetails = ({ pitch }: PitchDetailsProps) => {
  const pitchDeal = pitch.pitchDeal || {};

  const detailSections = [
    {
      id: "business",
      title: "The Business",
      icon: Building2,
      content: pitchDeal.business || "Business information not provided yet.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "market",
      title: "The Market",
      icon: TrendingUp,
      content: pitchDeal.market || "Market information not provided yet.",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "progress",
      title: "Progress & Proof",
      icon: BarChart3,
      content: pitchDeal.progress || "Progress information not provided yet.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "objectives",
      title: "Objectives & Future",
      icon: Target,
      content:
        pitchDeal.objectives || "Objectives information not provided yet.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Pitch Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-background dark:text-white">
        {detailSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card
              key={section.id}
              className="hover:shadow-lg transition-shadow duration-300 dark:bg-background"
            >
              <CardHeader
                className={`${section.bgColor} border-b dark:bg-background`}
              >
                <CardTitle
                  className={`flex items-center dark:bg-background dark:text-white ${section.color}`}
                >
                  <IconComponent className="h-6 w-6 mr-3" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose prose-sm max-w-none">
                  {section.content.includes("not provided") ? (
                    <p className="text-muted-foreground italic">
                      {section.content}
                    </p>
                  ) : (
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PitchDetails;
