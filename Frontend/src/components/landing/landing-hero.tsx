import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { ArrowRight, CheckCircle, ChevronRight } from "lucide-react";
import { stats } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Link from "next/link";

export default function LandingHero() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-hero-pattern bg-cover bg-center opacity-10 dark:opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/50 to-background/90 dark:from-background/95 dark:via-background/80 dark:to-background/95" />

      <div className="container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="animate-slide-up">
            <Badge
              variant="outline"
              className="mb-4 text-sm py-1 border-primary/30 bg-primary/5"
            >
              Connecting Visionaries with Capital
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
              Connecting <span className="text-gradient"> Capital</span> Shaping{" "}
              <span className="text-gradient">Futures</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl text-balance">
              KonnectSphere streamlines the investment process, providing
              entrepreneurs and investors with the tools they need to make
              informed decisions and build successful partnerships.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="font-medium shadow-gold">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t flex items-center gap-8">
              {stats.slice(0, 2).map((stat, index) => (
                <div key={index}>
                  <p className="text-2xl md:text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:ml-auto relative animate-slide-up">
            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg blur opacity-50"></div>
            <div className="relative bg-card rounded-lg shadow-lg overflow-hidden">
              <Tabs defaultValue="entrepreneur" className="w-full">
                <TabsList className="grid w-full grid-cols-2 ">
                  <TabsTrigger value="entrepreneur">
                    For Entrepreneurs
                  </TabsTrigger>
                  <TabsTrigger value="investor">For Investors</TabsTrigger>
                </TabsList>
                <TabsContent value="entrepreneur" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      Showcase Your Vision
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Create compelling pitches and connect with the right
                      investors for your venture.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Create professional pitch decks with guided templates",
                      "Match with investors who specialize in your industry",
                      "Secure communication channels for negotiations",
                      "Track investor interest and engagement metrics",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/add-pitch">
                    <Button className="w-full mt-4">
                      Create a Pitch
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </TabsContent>
                <TabsContent value="investor" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">
                      Discover Opportunities
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Find promising ventures and make informed investment
                      decisions with comprehensive tools.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      "Browse curated investment opportunities",
                      "Detailed due diligence tools and templates",
                      "Direct communication with founders",
                      "Portfolio tracking and performance analytics",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/explore-pitches">
                    <Button className="w-full mt-4">
                      Discover pitches
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
