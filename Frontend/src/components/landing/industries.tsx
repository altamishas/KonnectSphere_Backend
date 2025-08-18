"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { INDUSTRIES, Industry } from "@/lib/constants";
import {
  Wheat,
  Building2,
  GraduationCap,
  Zap,
  Gamepad2,
  Shirt,
  BadgeDollarSign,
  UtensilsCrossed,
  Coffee,
  Cog,
  Camera,
  HeartPulse,
  Scissors,
  Package,
  Home,
  ShoppingBag,
  TrendingUp,
  Code2,
  Laptop,
  Truck,
} from "lucide-react";
import Link from "next/link";

// Dynamic icon mapper
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Wheat,
  Building2,
  GraduationCap,
  Zap,
  Gamepad2,
  Shirt,
  BadgeDollarSign,
  UtensilsCrossed,
  Coffee,
  Cog,
  Camera,
  HeartPulse,
  Scissors,
  Package,
  Home,
  ShoppingBag,
  TrendingUp,
  Code2,
  Laptop,
  Truck,
};

// Helper function to get color classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { text: string; bg: string; hover: string }> =
    {
      green: {
        text: "text-green-600",
        bg: "bg-green-50",
        hover: "group-hover:bg-green-100",
      },
      blue: {
        text: "text-blue-600",
        bg: "bg-blue-50",
        hover: "group-hover:bg-blue-100",
      },
      purple: {
        text: "text-purple-600",
        bg: "bg-purple-50",
        hover: "group-hover:bg-purple-100",
      },
      yellow: {
        text: "text-yellow-600",
        bg: "bg-yellow-50",
        hover: "group-hover:bg-yellow-100",
      },
      pink: {
        text: "text-pink-600",
        bg: "bg-pink-50",
        hover: "group-hover:bg-pink-100",
      },
      rose: {
        text: "text-rose-600",
        bg: "bg-rose-50",
        hover: "group-hover:bg-rose-100",
      },
      emerald: {
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        hover: "group-hover:bg-emerald-100",
      },
      orange: {
        text: "text-orange-600",
        bg: "bg-orange-50",
        hover: "group-hover:bg-orange-100",
      },
      amber: {
        text: "text-amber-600",
        bg: "bg-amber-50",
        hover: "group-hover:bg-amber-100",
      },
      gray: {
        text: "text-gray-600",
        bg: "bg-gray-50",
        hover: "group-hover:bg-gray-100",
      },
      violet: {
        text: "text-violet-600",
        bg: "bg-violet-50",
        hover: "group-hover:bg-violet-100",
      },
      red: {
        text: "text-red-600",
        bg: "bg-red-50",
        hover: "group-hover:bg-red-100",
      },
      indigo: {
        text: "text-indigo-600",
        bg: "bg-indigo-50",
        hover: "group-hover:bg-indigo-100",
      },
      cyan: {
        text: "text-cyan-600",
        bg: "bg-cyan-50",
        hover: "group-hover:bg-cyan-100",
      },
      stone: {
        text: "text-stone-600",
        bg: "bg-stone-50",
        hover: "group-hover:bg-stone-100",
      },
      slate: {
        text: "text-slate-600",
        bg: "bg-slate-50",
        hover: "group-hover:bg-slate-100",
      },
      zinc: {
        text: "text-zinc-600",
        bg: "bg-zinc-50",
        hover: "group-hover:bg-zinc-100",
      },
    };

  return (
    colorMap[color] || {
      text: "text-gray-600",
      bg: "bg-gray-50",
      hover: "group-hover:bg-gray-100",
    }
  );
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

export default function Industries() {
  const renderIcon = (industry: Industry) => {
    const IconComponent = iconMap[industry.iconName];
    const colors = getColorClasses(industry.color);

    if (!IconComponent) {
      return <div className={`h-8 w-8 ${colors.text}`}>•</div>;
    }

    return <IconComponent className={`h-8 w-8 ${colors.text}`} />;
  };

  return (
    <section className="py-16 md:py-24 bg-gray-50/30 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Industries We Support</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            KonnectSphere facilitates investments across diverse industries,
            connecting innovative startups with investors who share their vision
            for growth and success.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {INDUSTRIES.map((industry, index) => {
            const colors = getColorClasses(industry.color);

            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border border-border/60 hover:border-primary/20">
                  <CardContent className="p-4 flex flex-col items-center text-center h-full">
                    <div
                      className={`mb-3 p-3 rounded-xl ${colors.bg} ${colors.hover} transition-colors duration-300`}
                    >
                      {renderIcon(industry)}
                    </div>
                    <h3 className="text-sm font-semibold mb-2 leading-tight">
                      {industry.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {industry.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Don&apos;t see your industry? We&apos;re always expanding our
            coverage.
          </p>
          <Link href="/contact">
            <button className="text-primary hover:text-primary/80 font-medium text-sm transition-colors cursor-pointer ">
              Contact us to learn more →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
