import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Share2, Bookmark, MapPin } from "lucide-react";
import { ViewPitchData } from "@/lib/types/pitch-view";
import { getCountryName } from "@/lib/utils";

interface PitchHeroProps {
  pitch: ViewPitchData;
}

const PitchHero = ({ pitch }: PitchHeroProps) => {
  const companyInfo = pitch.companyInfo || {};
  const media = pitch.media || {};

  // Fallback images
  const bannerImage =
    media.banner?.url ||
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80";
  const logoImage =
    media.logo?.url ||
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=326&q=80";

  return (
    <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
      <Image
        src={bannerImage}
        alt={companyInfo.pitchTitle || "Pitch Banner"}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Action Buttons */}
      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/90 hover:bg-white"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: companyInfo.pitchTitle,
                text: companyInfo.pitchTitle,
                url: window.location.href,
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/90 hover:bg-white"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </div>

      {/* Hero Content */}
      <div className="absolute bottom-8 left-8 right-8 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-4 border-white/80 flex-shrink-0">
            <Image
              src={logoImage}
              alt={`${companyInfo.pitchTitle} logo`}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-grow">
            <h1 className="text-3xl md:text-5xl font-bold mb-2">
              {companyInfo.pitchTitle || "Untitled Pitch"}
            </h1>
            {/* Show full country name */}
            {companyInfo.country && (
              <div className="flex items-center text-lg mb-4">
                <MapPin className="h-5 w-5 mr-2" />
                {getCountryName(companyInfo.country)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PitchHero;
