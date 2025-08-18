import FeaturedInvestments from "@/components/landing/featured-investments";
import FeaturedInvestors from "@/components/landing/featured-investors";
import { HowItWorks } from "@/components/landing/how-it-works";
import Industries from "@/components/landing/industries";
import LandingHero from "@/components/landing/landing-hero";
import Pricing from "@/components/landing/pricing-section";
import Testimonials from "@/components/landing/testimonial-section";

export default function Home() {
  return (
    <>
      <LandingHero />
      <FeaturedInvestments />
      <HowItWorks />
      <Industries />
      <FeaturedInvestors />
      <Testimonials />
      <Pricing />
    </>
  );
}
