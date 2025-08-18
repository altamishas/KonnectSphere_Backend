import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ViewPitchData, PitchTeamMember } from "@/lib/types/pitch-view";

interface PitchTeamProps {
  pitch: ViewPitchData;
}

const PitchTeam = ({ pitch }: PitchTeamProps) => {
  const team = pitch.team || {};
  const members = team.members || [];

  if (!members.length) {
    return (
      <div>
        <h2 className="text-3xl font-bold mb-8">The Team</h2>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              No team information available yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">The Team</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member: PitchTeamMember, index: number) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={member.profileImage?.url}
                    alt={member.name}
                  />
                  <AvatarFallback>
                    {member.name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-primary font-medium">{member.role}</p>
                  {member.bio && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {member.bio}
                    </p>
                  )}

                  <div className="mt-4 space-y-2">
                    {member.experience && (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {member.experience} experience
                      </div>
                    )}

                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.skills.map(
                          (skill: string, skillIndex: number) => (
                            <Badge
                              key={skillIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    )}

                    {member.linkedinUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        asChild
                      >
                        <Link href={member.linkedinUrl} target="_blank">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          LinkedIn
                        </Link>
                      </Button>
                    )}
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

export default PitchTeam;
