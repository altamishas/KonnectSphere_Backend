import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import AskQuestionButton from "@/components/pitch/AskQuestionButton";

import type { PitchInfo } from "@/lib/types/chat";

interface PitchContactProps {
  pitch: PitchInfo;
}

const PitchContact = ({ pitch }: PitchContactProps) => {
  return (
    <div>
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            Got Questions About This Investment?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Connect directly with the founding team to get answers to your
            questions. Our entrepreneurs are ready to discuss their vision,
            business model, and growth plans with potential investors.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <AskQuestionButton
              pitch={pitch}
              className="bg-primary hover:bg-primary/90 px-8"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PitchContact;
