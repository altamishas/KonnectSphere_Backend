"use client";

import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search,
  HelpCircle,
  DollarSign,
  UserCog,
  Shield,
  AlertCircle,
  Aperture,
} from "lucide-react";

// FAQ categories with their respective icons
const categories = [
  { id: "general", name: "General", icon: Aperture },
  { id: "subscription", name: "Subscription & Payments", icon: DollarSign },
  { id: "account", name: "Account Management", icon: UserCog },
  { id: "security", name: "Security & Privacy", icon: Shield },
  { id: "reporting", name: "Reporting & Support", icon: AlertCircle },
];

const faqs = [
  {
    id: "1",
    category: "general",
    question: "What is KonnectSphere?",
    answer:
      "KonnectSphere is an online platform where entrepreneurs and investors connect globally. Entrepreneurs can showcase their business ideas while investors explore potential funding opportunities.",
  },
  {
    id: "2",
    category: "general",
    question: "Is KonnectSphere a financial advisor or investment firm?",
    answer:
      "No. KonnectSphere does not offer investment advice or guarantee funding. We simply provide a space for networking and discovery.",
  },
  {
    id: "3",
    category: "general",
    question: "Can entrepreneurs edit their pitch after submitting?",
    answer:
      "No. Once submitted, pitches cannot be edited. This is to maintain integrity and encourage serious submissions.",
  },
  {
    id: "4",
    category: "subscription",
    question:
      "What happens if an entrepreneur does not pay the subscription fee?",
    answer:
      "After 3 days: Pitch is hidden from the platform and the access is denied.",
  },
  {
    id: "5",
    category: "subscription",
    question: "Are refunds available?",
    answer:
      "No. KonnectSphere has a strict no-refund policy for all subscriptions.",
  },
  {
    id: "6",
    category: "subscription",
    question: "How do I cancel my subscription?",
    answer:
      "You can manage your subscription from your account dashboard. Deactivating your account will stop future charges.",
  },
  {
    id: "7",
    category: "general",
    question: "How do I become an investor on KonnectSphere?",
    answer:
      "To become an investor, simply sign up on our platform, complete the required profile information, and pay the annual subscription fee. Once registered, you'll be able to browse entrepreneurs' pitches and connect with business owners that meet your investment criteria.",
  },
  {
    id: "8",
    category: "subscription",
    question: "What happens if I don't pay my investor subscription fee?",
    answer:
      "If your subscription expires and is not renewed, your access to the platform will be restricted. You will need to reactivate your subscription to regain full access to the platform.",
  },
  {
    id: "9",
    category: "general",
    question:
      "Can investors interact with entrepreneurs directly on KonnectSphere?",
    answer:
      "Yes, investors can connect with entrepreneurs via private messaging through the platform.",
  },
  {
    id: "10",
    category: "general",
    question: "How do I search for investment opportunities?",
    answer:
      "Investors can use our advanced search filters to find pitches based on industry, location, funding amount, and other criteria. You can also receive pitch recommendations tailored to your investment preferences.",
  },
  {
    id: "11",
    category: "general",
    question: "Can I invest in multiple ventures on KonnectSphere?",
    answer:
      "Yes, investors can explore and invest in multiple entrepreneurial ventures, depending on their preferences and investment strategy.",
  },
  {
    id: "12",
    category: "security",
    question: "Is my payment secure when subscribing to the platform?",
    answer:
      "Yes, all payments are processed securely via third-party payment providers, ensuring the highest level of security for your financial information.",
  },
  {
    id: "13",
    category: "subscription",
    question: "Will my subscription renew automatically?",
    answer:
      "Yes. Subscriptions are automatically renewed unless you deactivate your account before the next billing cycle.",
  },
  {
    id: "14",
    category: "reporting",
    question:
      "Can I report an investor or entrepreneur for misconduct or suspicious activity?",
    answer: `Yes. If you believe an investor or entrepreneur has engaged in fraudulent activity, harassment, misrepresentation, or any unethical conduct, you may report them. All reports must include valid evidence. Our team will investigate and take necessary action, which may include warnings, suspension, or banning.

Submit reports with:
• Name of the individual being reported
• Detailed description of the issue
• Supporting documents or screenshots`,
  },
  {
    id: "15",
    category: "subscription",
    question: "What benefits do investors get with a paid subscription?",
    answer:
      "With a paid subscription, investors gain access to exclusive pitch decks, advanced search filters, early-stage deal flow, and global exposure to vetted entrepreneurial talent.",
  },
  {
    id: "16",
    category: "account",
    question: "Can I deactivate and reactivate my account later?",
    answer:
      "Yes. You can deactivate your account anytime and reactivate it later. Please note that pitches and account data are hidden from platform until reactivation.",
  },
  {
    id: "17",
    category: "account",
    question: "What happens when I delete my account?",
    answer:
      "If you choose to delete your account, all associated data—including messages, pitches, and connections—will be permanently removed and cannot be recovered.",
  },
];

export default function FAQsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter FAQs based on search query and selected category
  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions about KonnectSphere
          </p>
        </div>

        {/* Search Section */}
        <Card className="p-6 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search FAQs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className="rounded-full"
            >
              All
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </Card>

        {/* FAQs Accordion */}
        <div className="space-y-6">
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-4">
              {filteredFaqs.map((faq) => (
                <AccordionItem
                  key={faq.id}
                  value={faq.id}
                  className="bg-background rounded-lg border px-6"
                >
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer.split("\n").map((paragraph, index) => (
                      <p key={index} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                No FAQs found matching your search criteria
              </p>
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Can&apos;t find what you&apos;re looking for?{" "}
            <a
              href="mailto:contact@konnectsphere.net"
              className="text-primary hover:underline"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
