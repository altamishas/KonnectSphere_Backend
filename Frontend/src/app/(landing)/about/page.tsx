"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Globe2,
  Rocket,
  Users,
  Target,
  ArrowRight,
  Building2,
  LineChart,
  ShieldCheck,
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const stats = [
  {
    icon: <Building2 className="h-6 w-6" />,
    value: "500+",
    label: "Active Startups",
  },
  {
    icon: <Users className="h-6 w-6" />,
    value: "1000+",
    label: "Global Investors",
  },
  {
    icon: <LineChart className="h-6 w-6" />,
    value: "$50M+",
    label: "Investment Facilitated",
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    value: "50+",
    label: "Countries Reached",
  },
];

const features = [
  {
    icon: <Globe2 className="h-6 w-6 text-primary" />,
    title: "Global Reach",
    description:
      "Connect with entrepreneurs and investors worldwide, breaking down geographical barriers.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "Secure Platform",
    description:
      "State-of-the-art security measures to protect your data and transactions.",
  },
  {
    icon: <Target className="h-6 w-6 text-primary" />,
    title: "Smart Matching",
    description:
      "Advanced algorithms to connect you with the most relevant opportunities.",
  },
  {
    icon: <Rocket className="h-6 w-6 text-primary" />,
    title: "Innovation Focus",
    description:
      "Supporting groundbreaking ideas and revolutionary business models.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />

        <div className="container relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary">
              <span className="text-black dark:text-white">About</span>{" "}
              KonnectSphere
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Connecting visionary entrepreneurs with forward-thinking investors
              globally
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold mb-4">
                Shaping the Future of Global Investment
              </h2>
              <div className="prose dark:prose-invert">
                <p className="text-lg text-muted-foreground">
                  KonnectSphere is a premier UAE-based global platform that
                  enables meaningful connections between visionary entrepreneurs
                  and forward-thinking investors from around the world. Our
                  mission is clear: &ldquo;Connecting Capital, Shaping
                  Futures.&rdquo;
                </p>
                <p className="text-lg text-muted-foreground">
                  Whether you&apos;re an entrepreneur seeking funding or an
                  investor looking for your next big opportunity, KonnectSphere
                  provides the digital space to connect, collaborate, and grow.
                  We break down geographic barriers to offer a borderless
                  experience where ideas and capital unite to drive innovation
                  and impact.
                </p>
                <p className="text-lg text-muted-foreground">
                  Our secure, intuitive platform is designed to support you at
                  every step of the journey—from showcasing your business pitch
                  to exploring and investing in promising ventures.
                  KonnectSphere is more than just a platform; it&apos;s a global
                  movement shaping the future of entrepreneurship and
                  investment.
                </p>
              </div>
              <div className="pt-6">
                <Link href="/register">
                  <Button size="lg" className="rounded-full">
                    Join Our Platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="relative"
            >
              <div className="aspect-square relative rounded-2xl overflow-hidden">
                <Image
                  src="/images/pic2.jpg"
                  alt="KonnectSphere Platform"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-xl bg-muted/50"
              >
                <div className="flex justify-center mb-4 text-primary">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-background border border-border/60 hover:border-primary/60 transition-colors"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-background">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to Shape the Future?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join KonnectSphere today and be part of the global innovation
              movement.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="rounded-full">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="rounded-full">
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
