import TestimonialSection from "@/components/landing/testimonial-section";

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            What Our Users Say
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Hear from entrepreneurs and investors who have found success through
            KonnectSphere
          </p>
        </div>
        <TestimonialSection />
      </div>
    </div>
  );
}
