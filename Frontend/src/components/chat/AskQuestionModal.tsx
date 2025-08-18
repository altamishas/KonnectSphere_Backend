"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

import { MessageCircle, Building2, MapPin } from "lucide-react";
import { AskQuestionModalProps } from "@/lib/types/chat";
import Image from "next/image";

const AskQuestionModal = ({
  pitch,
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AskQuestionModalProps) => {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage("");
    }
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <span>Start a Conversation</span>
          </DialogTitle>
          <DialogDescription>
            Send a message to the entrepreneur to start discussing this pitch.
          </DialogDescription>
        </DialogHeader>

        {/* Pitch Preview */}
        <Card className="p-4 bg-gray-50">
          <div className="flex items-start space-x-3">
            {pitch.media?.logo && (
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border">
                <Image
                  src={pitch.media.logo.url}
                  alt={pitch.companyInfo.pitchTitle}
                  className="w-full h-full object-cover"
                  width={48}
                  height={48}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-center truncate">
                {pitch.companyInfo.pitchTitle}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {pitch.companyInfo.description}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {pitch.companyInfo.country}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="message">Your Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I'm interested in learning more about your pitch. Could you provide more details about..."
            className="min-h-[120px]"
            maxLength={1000}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Be specific about what interests you most</span>
            <span>{message.length}/1000</span>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Tips for a great first message:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Mention specific aspects of the pitch that interest you</li>
            <li>• Ask about market opportunity, traction, or business model</li>
            <li>• Share relevant experience or connections you might have</li>
            <li>• Be professional and respectful</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </div>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AskQuestionModal;
