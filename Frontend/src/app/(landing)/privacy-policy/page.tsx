"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChevronRight, Mail, Shield, Lock, Cookie } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Learn how KonnectSphere protects and handles your data
          </p>
        </div>

        {/* Main Content */}
        <Card className="p-6 md:p-8 bg-background shadow-lg">
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-8">
              {/* Introduction */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg">
                  KonnectSphere is committed to protecting your privacy. This
                  Privacy Policy outlines how we collect, use, disclose, and
                  protect your information in accordance with the UAE Federal
                  Decree Law No. 45 of 2021 (Personal Data Protection Law) and
                  relevant Free Zone regulations.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, index) => (
                <section key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    {section.icon && (
                      <span className="text-primary">{section.icon}</span>
                    )}
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                      <ChevronRight className="h-6 w-6 text-primary" />
                      {section.title}
                    </h2>
                  </div>
                  {section.content.map((paragraph, pIndex) => (
                    <div key={pIndex} className="space-y-4">
                      {paragraph.subtitle && (
                        <h3 className="text-xl font-medium mt-6 mb-3">
                          {paragraph.subtitle}
                        </h3>
                      )}
                      {paragraph.text &&
                        paragraph.text.map((text, tIndex) => (
                          <p
                            key={tIndex}
                            className="text-muted-foreground leading-relaxed"
                          >
                            {text}
                          </p>
                        ))}
                      {paragraph.list && (
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          {paragraph.list.map(
                            (item: string, lIndex: number) => (
                              <li key={lIndex} className="leading-relaxed">
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>
              ))}

              {/* Contact Section */}
              <section className="border-t pt-8 mt-8">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                  <span>
                    For questions or concerns about this Privacy Policy, contact
                    us at:
                  </span>
                  <a
                    href="mailto:contact@konnectsphere.net"
                    className="text-primary hover:underline"
                  >
                    contact@konnectsphere.net
                  </a>
                </div>
              </section>
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}

// Define types for sections
interface SectionContent {
  subtitle?: string;
  text?: string[];
  list?: string[];
  text2?: string[];
}

interface Section {
  title: string;
  icon?: React.ReactNode;
  content: SectionContent[];
}

const sections: Section[] = [
  {
    title: "1. Legal Basis for Data Processing",
    icon: <Lock className="h-6 w-6" />,
    content: [
      {
        text: ["We collect and process your data only:"],
        list: [
          "With your clear consent",
          "When required to fulfill our services",
          "To comply with legal obligations under UAE laws",
        ],
        text2: [
          "We do not sell, lease, or disclose your personal data to third parties without your consent, except where legally required.",
        ],
      },
    ],
  },
  {
    title: "2. Your Rights Under UAE PDPL",
    content: [
      {
        text: ["As a user, you have the right to:"],
        list: [
          "Access your personal data",
          "Correct or update your personal data",
          "Request deletion of your account and data",
          "Object to certain types of processing",
          "File a complaint with the UAE Data Office if your data is mishandled",
        ],
        text2: [
          "All data requests will be handled in accordance with UAE regulatory timelines.",
        ],
      },
    ],
  },
  {
    title: "3. International Transfers",
    content: [
      {
        text: [
          "If data must be transferred outside the UAE, we will ensure compliance with cross-border data transfer protocols under the PDPL and only work with jurisdictions approved by UAE data protection authorities.",
        ],
      },
    ],
  },
  {
    title: "4. Information We Collect",
    content: [
      {
        text: ["We collect the following categories of data:"],
        list: [
          "Personal Information: Name, email address, phone number, profile photo, and country",
          "Business Information: Startup description, investment requirements, financial documents (if provided)",
          "Billing Information: Credit/debit card details (processed through secure third-party payment gateways)",
          "Usage Data: IP address, login activity, browsing behavior on the platform",
        ],
      },
    ],
  },
  {
    title: "5. How We Use Your Data",
    content: [
      {
        text: ["Your data is used to:"],
        list: [
          "Facilitate investor-entrepreneur matches",
          "Personalize your experience",
          "Process payments and manage subscriptions",
          "Send platform updates, emails, and promotional messages",
          "Improve our services through analytics",
        ],
      },
    ],
  },
  {
    title: "6. Data Sharing and Disclosure",
    content: [
      {
        text: [
          "We do not sell or rent your personal information. However, by using KonnectSphere, you grant us permission to:",
        ],
        list: [
          "Display your public profile and pitch content across our platform",
          "Use your business name, pitch summary, and/or profile image for promotional purposes (on our website, social media, or advertising)",
          "Third-party service providers (e.g., payment processors, hosting providers)",
          "Government authorities, when required by UAE law",
        ],
      },
    ],
  },
  {
    title: "7. Data Storage and Retention",
    content: [
      {
        text: [
          "All data is stored on secure UAE-based or globally compliant cloud servers",
          "We retain data for as long as your account is active, and up to 6 months after account deactivation",
        ],
      },
    ],
  },
  {
    title: "8. Your Rights",
    content: [
      {
        text: ["You have the right to:"],
        list: [
          "Access the personal data we hold about you",
          "Request correction or deletion of inaccurate or outdated data",
          "Withdraw consent at any time by deactivating your account",
        ],
      },
    ],
  },
  {
    title: "9. Cookies",
    icon: <Cookie className="h-6 w-6" />,
    content: [
      {
        text: [
          "By using KonnectSphere, you grant us permission to use cookies for session management, analytics, and user experience personalization. KonnectSphere uses cookies to ensure the proper functionality of our platform, improve your user experience, and analyze website traffic.",
          "Some cookies are essential and cannot be disabled, while others help us understand how our services are being used and allow us to personalize content and ads. By continuing to browse or using our services, you agree to the use of cookies in accordance with our Cookies Policy.",
          "You can manage your cookie preferences through the Cookie Settings link or your browser settings at any time.",
        ],
      },
    ],
  },
  {
    title: "10. Marketing and Public Display",
    content: [
      {
        text: ["By using KonnectSphere, you grant us permission to:"],
        list: [
          "Display your public profile, business pitch, and associated media on our platform",
          "Use your public profile image, first or last name, country, and company name for promotional purposes across our website, email campaigns, and social media platforms",
        ],
      },
    ],
  },
  {
    title: "11. Data Security",
    content: [
      {
        text: [
          "At KonnectSphere, we are committed to protecting your personal and business information. We implement rigorous administrative, technical, and physical security measures designed to safeguard your data against unauthorized access, disclosure, alteration, or destruction.",
          "However, despite our best efforts, no method of transmission over the internet, or method of electronic storage, is completely secure. Therefore, we do not and cannot guarantee the absolute security of any information you transmit or store through our platform.",
          "By using KonnectSphere, you acknowledge and agree that you provide your information at your own risk, and KonnectSphere will not be held liable for any unauthorized access, loss, or damage to your data beyond our reasonable control.",
        ],
      },
    ],
  },
  {
    title: "12. Changes to This Policy",
    content: [
      {
        text: [
          "KonnectSphere reserves the right to modify or update this Privacy Policy at any time to reflect changes in our practices, legal obligations, or for other operational, legal, or regulatory reasons. Significant changes will be communicated to users via email or a prominent notice on the platform.",
          "We encourage you to review this page periodically to stay informed about how we protect your information. Your continued use of the platform after any changes constitutes your acceptance of the revised Privacy Policy.",
        ],
      },
    ],
  },
  {
    title: "13. User Content Compliance & Legal Obligations",
    content: [
      {
        text: [
          "KonnectSphere is committed to upholding the laws and cultural values of the United Arab Emirates. As such, all content submitted by users—including but not limited to business pitches, profile descriptions, images, or comments—must comply with applicable UAE laws, including:",
        ],
        list: [
          "Federal Decree-Law No. 34 of 2021 on Combatting Rumors and Cybercrimes",
          "UAE Federal Law No. 15 of 2020 on Consumer Protection",
          "UAE Personal Data Protection Law (PDPL)",
          "Any regulations pertaining to public morality, religious respect, and online behavior",
        ],
        text2: [
          "By using KonnectSphere, users agree not to upload, share, or distribute any content that is false, misleading, offensive, unethical, defamatory, or unlawful under UAE law. We reserve the right to:",
          "Review, monitor, and moderate all user-generated content.",
          "Remove or restrict access to any content deemed in violation of UAE laws or our platform policies.",
          "Report unlawful content or activity to relevant UAE authorities when legally required.",
          "Cooperate fully with law enforcement agencies or regulatory bodies upon official request.",
          "Users understand and agree that KonnectSphere is not responsible for the accuracy, reliability, or legality of user-submitted content, and that submission of content in violation of applicable laws may result in suspension or termination of their account.",
        ],
      },
    ],
  },
  {
    title: "14. Contact",
    content: [
      {
        text: [
          "If you have any questions or concerns about this Privacy Policy.",
          "Contact: 📧 contact@konnectsphere.net",
        ],
      },
    ],
  },
];
