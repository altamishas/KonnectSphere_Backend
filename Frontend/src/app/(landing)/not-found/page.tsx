"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-card to-secondary flex items-center justify-center p-4 relative overflow-hidden dark:from-background dark:via-card dark:to-secondary">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-2xl animate-ping"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>

      <Card className="w-full max-w-2xl bg-card/80 backdrop-blur-xl border-border shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"></div>
        <CardContent className="p-12 text-center relative z-10">
          {/* 404 with glitch effect */}
          <div className="relative mb-8">
            <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-9xl font-black text-destructive/20 animate-glitch">
              404
            </div>
          </div>

          {/* Main message */}
          <div className="space-y-4 mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Oops! Page Not Found
            </h2>
            <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
              The page you are looking for seems to have drifted into the
              digital void. Lets get you back on track!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() => (window.location.href = "/")}
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-black text-primary  backdrop-blur-sm px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
              onClick={() => (window.location.href = "/explore-pitches")}
            >
              <Search className="w-5 h-5 mr-2" />
              Explore Pitches
            </Button>
          </div>

          {/* Error code for debugging */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-gray-500 font-mono">
              Error Code: 404 | Page Not Found
            </p>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes glitch {
          0% {
            transform: translate(0);
          }
          20% {
            transform: translate(-2px, 2px);
          }
          40% {
            transform: translate(-2px, -2px);
          }
          60% {
            transform: translate(2px, 2px);
          }
          80% {
            transform: translate(2px, -2px);
          }
          100% {
            transform: translate(0);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-glitch {
          animation: glitch 0.3s infinite;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}
