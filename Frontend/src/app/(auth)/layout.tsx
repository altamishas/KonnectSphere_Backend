// app/(landing)/layout.tsx
import Footer from "@/components/landing/footer";
import LandingNav from "@/components/landing/landing-nav";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
