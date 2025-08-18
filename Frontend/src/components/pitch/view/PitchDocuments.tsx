import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  FileText,
  BarChart3,
  Award,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { ViewPitchData, PitchDocument } from "@/lib/types/pitch-view";

interface PitchDocumentsProps {
  pitch: ViewPitchData;
}

const PitchDocuments = ({ pitch }: PitchDocumentsProps) => {
  const documents = pitch.documents || {};

  // Create a list of available documents
  const availableDocuments = [];

  if (documents.businessPlan) {
    availableDocuments.push({
      name: documents.businessPlan.originalName || "Business Plan",
      type: "Business Plan",
      icon: FileText,
      url: documents.businessPlan.url,
      size: "N/A",
    });
  }

  if (documents.financials) {
    availableDocuments.push({
      name: documents.financials.originalName || "Financial Projections",
      type: "Financial",
      icon: BarChart3,
      url: documents.financials.url,
      size: "N/A",
    });
  }

  if (documents.pitchDeck) {
    availableDocuments.push({
      name: documents.pitchDeck.originalName || "Pitch Deck",
      type: "Presentation",
      icon: Award,
      url: documents.pitchDeck.url,
      size: "N/A",
    });
  }

  if (documents.executiveSummary) {
    availableDocuments.push({
      name: documents.executiveSummary.originalName || "Executive Summary",
      type: "Executive Summary",
      icon: Lightbulb,
      url: documents.executiveSummary.url,
      size: "N/A",
    });
  }

  if (
    documents.additionalDocuments &&
    documents.additionalDocuments.length > 0
  ) {
    documents.additionalDocuments.forEach(
      (doc: PitchDocument, index: number) => {
        availableDocuments.push({
          name: doc.originalName || `Additional Document ${index + 1}`,
          type: "Additional Document",
          icon: TrendingUp,
          url: doc.url,
          size: "N/A",
        });
      }
    );
  }

  if (!availableDocuments.length) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8">Documents</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No documents available yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDownload = (url: string, filename: string) => {
    // Create a temporary link to download the file
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Documents</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableDocuments.map((doc, index) => (
          <Card
            key={index}
            className="hover:shadow-md transition-all duration-300 group"
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <doc.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">{doc.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {doc.size}
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => handleDownload(doc.url, doc.name)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PitchDocuments;
