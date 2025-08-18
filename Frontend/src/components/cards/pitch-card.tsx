import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Users } from "lucide-react";
import { PitchCardProps } from "@/lib/types";
// import { useQueryClient } from "@tanstack/react-query";
import { useFavouritePitch } from "@/hooks/pitch/useFavouritePitch";
import { toast } from "sonner";

export function PitchCard({
  id,
  title,
  company,
  description,
  industry,
  image,
  fundingGoal,
  fundingCurrent,
  investors,
  daysLeft,
}: PitchCardProps) {
  // const queryClient = useQueryClient();
  const fundingPercentage = (fundingCurrent / fundingGoal) * 100;

  // Use guarded favourites hook (only fetches when authenticated)
  const {
    isInFavorites: isFavourite,
    isLoading,
    toggleFavorite,
  } = useFavouritePitch(id);

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any parent click handlers
    try {
      toggleFavorite();
    } catch (error) {
      toast.error("Failed to update favourites");
      console.error("Favourite toggle error:", error);
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md border border-border/60 group h-full flex flex-col">
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={image || "/images/pic1.jpg"}
          alt={title}
          fill
          style={{ objectFit: "cover" }}
          className="group-hover:scale-105 transition-transform duration-500"
        />
        <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground hover:bg-primary/90">
          {industry}
        </Badge>
      </div>
      <CardContent className="p-5 flex-grow">
        <div className="mb-2 mt-1">
          <h3 className="text-xl font-semibold line-clamp-1 text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{company}</p>
        </div>
        <p className="text-sm line-clamp-2 mb-4 text-foreground">
          {description}
        </p>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1 text-foreground">
              <span>${fundingCurrent.toLocaleString()}</span>
              <span>${fundingGoal.toLocaleString()}</span>
            </div>
            <Progress value={fundingPercentage} className="h-2 bg-muted" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{fundingPercentage.toFixed(0)}% Funded</span>
              <span>{daysLeft} days left</span>
            </div>
          </div>

          <div className="flex items-center">
            <Users className="h-4 w-4 text-muted-foreground mr-1" />
            <span className="text-sm text-muted-foreground">
              {investors} investors
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          asChild
        >
          <Link href={`/view-pitch/${id}`}>View Pitch</Link>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={`border-primary hover:bg-primary/10 ${
            isFavourite ? "bg-red-50 text-red-600 border-red-300" : ""
          }`}
          onClick={handleToggleFavourite}
          disabled={isLoading}
        >
          <Heart className={`h-4 w-4 ${isFavourite ? "fill-current" : ""}`} />
          <span className="sr-only">
            {isFavourite ? "Remove from favourites" : "Add to favourites"}
          </span>
        </Button>
      </CardFooter>
    </Card>
  );
}
