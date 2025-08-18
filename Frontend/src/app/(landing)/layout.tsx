// app/(landing)/layout.tsx
import Footer from "@/components/landing/footer";
import LandingNav from "@/components/landing/landing-nav";
import { UnsubscribedBanner } from "@/components/ui/unsubscribed-banner";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingNav />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UnsubscribedBanner />
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}
