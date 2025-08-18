"use client";

import {
  CheckCircle,
  Briefcase,
  LightbulbIcon,
  Hand,
  Search,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isLeft?: boolean;
}

function Step({ icon, title, description, isLeft }: StepProps) {
  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex items-start gap-4",
        isLeft ? "text-left" : "text-right flex-row-reverse"
      )}
    >
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export function HowItWorks() {
  const entrepreneurSteps = [
    {
      icon: <LightbulbIcon className="h-6 w-6 text-primary" />,
      title: "Create Your Profile",
      description:
        "Set up your entrepreneur profile highlighting your expertise and vision.",
    },
    {
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: "Pitch Your Idea",
      description:
        "Develop a compelling pitch with clear business plans and funding requirements.",
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: "Connect with Investors",
      description:
        "Browse potential investors and initiate conversations with interested parties.",
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "Secure Funding",
      description:
        "Finalize investment details and start building your business with new capital.",
    },
  ];

  const investorSteps = [
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Create Investor Profile",
      description:
        "Set up your investor profile highlighting investment preferences and expertise.",
    },
    {
      icon: <Search className="h-6 w-6 text-primary" />,
      title: "Discover Opportunities",
      description:
        "Browse pitches filtered by industry, funding stage, or investment size.",
    },
    {
      icon: <Hand className="h-6 w-6 text-primary" />,
      title: "Express Interest",
      description:
        "Reach out to entrepreneurs whose ideas align with your investment strategy.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: "Manage Your Portfolio",
      description:
        "Track the performance of your investments through our dashboard.",
    },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold mb-4">How KonnectSphere Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our platform simplifies the investment process for both
            entrepreneurs and investors, creating valuable connections that
            drive innovation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="text-center mb-8">
                <div className="inline-block rounded-full bg-primary/10 p-3 mb-3">
                  <LightbulbIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">For Entrepreneurs</h3>
              </div>

              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-primary/20"></div>
                <div className="space-y-12">
                  {entrepreneurSteps.map((step, i) => (
                    <Step key={i} {...step} isLeft={true} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="relative"
            >
              <div className="text-center mb-8">
                <div className="inline-block rounded-full bg-[#d9c579]/10 p-3 mb-3">
                  <BarChart3 className="h-6 w-6 text-[#d9c579]" />
                </div>
                <h3 className="text-xl font-bold">For Investors</h3>
              </div>

              <div className="relative">
                <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#d9c579] to-[#d9c579]/20"></div>
                <div className="space-y-12">
                  {investorSteps.map((step, i) => (
                    <Step key={i} {...step} isLeft={false} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
