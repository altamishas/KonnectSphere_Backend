"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarIcon, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Testimonial } from "@/lib/types";
import { testimonials } from "@/lib/constants";

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState<Testimonial[]>(
    []
  );
  const [autoplay, setAutoplay] = useState(true);

  // Calculate how many testimonials to show based on screen size
  const getVisibleCount = useCallback(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3; // Default for SSR
  }, []);

  const [visibleCount, setVisibleCount] = useState(getVisibleCount());

  const updateVisibleTestimonials = useCallback(() => {
    const count = getVisibleCount();
    setVisibleCount(count);

    const visible: Testimonial[] = [];
    for (let i = 0; i < count; i++) {
      const index = (activeIndex + i) % testimonials.length;
      visible.push(testimonials[index]);
    }

    setVisibleTestimonials(visible);
  }, [activeIndex, getVisibleCount]);

  useEffect(() => {
    updateVisibleTestimonials();

    const handleResize = () => {
      updateVisibleTestimonials();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex, updateVisibleTestimonials]);

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay]);

  const handlePrev = () => {
    setAutoplay(false);
    setActiveIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  const handleNext = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from entrepreneurs and investors who have achieved their goals
            on KonnectSphere.
          </p>
        </div>

        <div className="relative">
          <div className="flex justify-between overflow-hidden">
            {visibleTestimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={cn("px-3 transition-all duration-500 ease-in-out", {
                  "opacity-0 translate-x-full": index >= visibleCount,
                  "w-full sm:w-1/2 lg:w-1/3": true,
                })}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <TestimonialCard testimonial={testimonial} />
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-8 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-primary hover:bg-primary"
              onClick={handlePrev}
              aria-label="Previous testimonial"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-primary hover:bg-primary"
              onClick={handleNext}
              aria-label="Next testimonial"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full flex flex-col border border-border/60 hover:shadow-md transition-all duration-300">
      <CardContent className="p-6 flex-grow flex flex-col">
        <div className="mb-6 flex-grow">
          <div className="flex mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon
                key={i}
                className={cn(
                  "h-4 w-4 mr-1",
                  i < testimonial.rating
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                )}
              />
            ))}
          </div>
          <p className="italic text-foreground">{testimonial.quote}</p>
        </div>

        <div className="flex items-center mt-4">
          <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4 border-2 border-primary">
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
          <div>
            <h4 className="font-medium">{testimonial.name}</h4>
            <p className="text-sm text-muted-foreground">
              {testimonial.title}, {testimonial.company}
            </p>
            <Badge type={testimonial.type} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Badge({ type }: { type: "entrepreneur" | "investor" }) {
  const bg = type === "entrepreneur" ? "bg-primary/10" : "bg-blue-500/10";
  const text = type === "entrepreneur" ? "text-primary" : "text-blue-500";

  return (
    <span
      className={cn(
        "inline-block text-xs px-2 py-1 rounded-full mt-1",
        bg,
        text
      )}
    >
      {type === "entrepreneur" ? "Entrepreneur" : "Investor"}
    </span>
  );
}
