import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { CheckCircle2, MapPin } from "lucide-react";
import { InvestorCardProps } from "@/lib/types";

export function InvestorCard({
  id,
  name,
  avatar,
  location,
  bio,
  industries,
  investmentRange,
  totalInvestments,
  verified,
}: InvestorCardProps) {
  return (
    <Card className="h-full w-full min-h-[400px] border border-border/60 hover:shadow-lg transition-all duration-300 flex flex-col">
      <CardContent className="p-6 flex-grow space-y-6">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-5">
          <div className="relative h-20 w-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#d9c579]">
            <Image
              src={avatar}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold truncate">{name}</h3>
              {verified && (
                <CheckCircle2 className="h-5 w-5 text-[#d9c579] flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Industries Tags */}
        <div className="flex flex-wrap gap-2">
          {industries.slice(0, 3).map((industry) => (
            <Badge
              key={industry}
              variant="outline"
              className="border-[#d9c579]/70 text-sm py-1 px-2.5"
            >
              {industry}
            </Badge>
          ))}
          {industries.length > 3 && (
            <Badge
              variant="outline"
              className="border-[#d9c579]/70 text-sm py-1 px-2.5"
            >
              +{industries.length - 3}
            </Badge>
          )}
        </div>

        {/* Bio Section */}
        <div>
          <p className="text-sm leading-relaxed line-clamp-3 text-muted-foreground">
            {bio}
          </p>
        </div>

        {/* Investment Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Investment Range
            </p>
            <p className="font-medium text-sm">{investmentRange}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">
              Total Investments
            </p>
            <p className="font-medium text-sm">{totalInvestments}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          className="w-full bg-primary hover:bg-[#c8b66c] text-black font-medium"
          size="lg"
          asChild
        >
          <Link href={`/investor/${id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
