import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";
import { ViewPitchData, PitchHighlight } from "@/lib/types/pitch-view";

interface PitchOverviewProps {
  pitch: ViewPitchData;
}

const PitchOverview = ({ pitch }: PitchOverviewProps) => {
  const companyInfo = pitch.companyInfo || {};
  const pitchDeal = pitch.pitchDeal || {};
  const media = pitch.media || {};

  // Calculate funding percentage
  const raisingAmount = parseFloat(companyInfo.raisingAmount || "0");
  const raisedSoFar = parseFloat(companyInfo.raisedSoFar || "0");
  const fundingPercentage =
    raisingAmount > 0 ? (raisedSoFar / raisingAmount) * 100 : 0;

  // Clean YouTube URL to remove @ prefix and convert to embed format
  const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // Remove @ prefix if it exists
    const cleanUrl = url.startsWith("@") ? url.substring(1) : url;

    // Convert YouTube watch URL to embed URL
    if (cleanUrl.includes("youtube.com/watch?v=")) {
      const videoId = cleanUrl.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // If it's already an embed URL, return as is
    if (cleanUrl.includes("youtube.com/embed/")) {
      return cleanUrl;
    }

    return cleanUrl;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Investment Details Card with Funding Data */}
      <div className="lg:col-span-1">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Award className="h-5 w-5 mr-2" />
              Investment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Funding Overview */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-3">
                Target
              </h4>
              <div className="text-2xl font-bold text-primary">
                $ {companyInfo.raisingAmount || "0"}
              </div>
              <div className="text-sm text-slate-500">
                $ {companyInfo.raisedSoFar || "0"} raised (
                {fundingPercentage.toFixed(0)}%)
              </div>
              <Progress value={fundingPercentage} className="h-2 mt-2" />
            </div>

            {/* Investment Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Minimum</span>
                <span className="font-medium">
                  $ {companyInfo.minimumInvestment || "0"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Previous Rounds</span>
                <span className="font-medium">
                  $ {companyInfo.previousRaised || "0"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Stage</span>
                <span className="font-medium">
                  {companyInfo.stage || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Deal Type</span>
                <span className="font-medium capitalize">
                  {pitchDeal.dealType || "Equity"}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Equity Offered</span>
                <span className="font-medium">10%</span>
              </div>
            </div>

            {/* Industries */}
            <div>
              <div className="text-sm font-medium text-slate-600 mb-2">
                Industries
              </div>
              <div className="flex flex-wrap gap-1">
                {companyInfo.industry1 && (
                  <Badge variant="outline" className="text-xs">
                    {companyInfo.industry1}
                  </Badge>
                )}
                {companyInfo.industry2 && (
                  <Badge variant="outline" className="text-xs">
                    {companyInfo.industry2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary and Highlights */}
      <div className="lg:col-span-2 space-y-6">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {pitchDeal.summary || "No summary available."}
            </p>
          </CardContent>
        </Card>

        {/* Highlights */}
        {pitchDeal.highlights && pitchDeal.highlights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pitchDeal.highlights.map(
                  (highlight: PitchHighlight, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:border-primary/30 transition-colors bg-white dark:bg-slate-900 dark:border-slate-700"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {highlight.title}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {highlight.title.includes("Growth") &&
                            "Consistent growth trajectory since launch with strong market traction"}
                          {highlight.title.includes("Users") &&
                            "Growing base of active monthly users demonstrating product-market fit"}
                          {highlight.title.includes("Award") &&
                            "Recognized as Fintech Innovation of the Year by industry leaders"}
                          {highlight.title.includes("Partnership") &&
                            "Strategic partnerships established with 3 major financial institutions"}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pitch Video */}
        {(media.youtubeUrl || media.uploadedVideo) && (
          <Card>
            <CardHeader>
              <CardTitle>Pitch Video</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-200 relative">
                {media.videoType === "youtube" && media.youtubeUrl ? (
                  <iframe
                    src={getEmbedUrl(media.youtubeUrl)}
                    title="Pitch Video"
                    className="w-full h-full"
                    allowFullScreen
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : media.uploadedVideo?.url ? (
                  <video
                    src={media.uploadedVideo.url}
                    className="w-full h-full object-cover"
                    controls
                    poster=""
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-sm">Click to play video</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PitchOverview;
