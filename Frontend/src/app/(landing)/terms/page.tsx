"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChevronRight, Mail } from "lucide-react";

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-muted/30 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
          <p className="text-muted-foreground">
            Please read these terms and conditions carefully before using
            KonnectSphere
          </p>
        </div>

        {/* Main Content */}
        <Card className="p-6 md:p-8 bg-background shadow-lg">
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg">
                  Welcome to KonnectSphere (&quot;we&quot;, &quot;our&quot;,
                  &quot;us&quot;). By registering, accessing, or using our
                  website (konnectsphere.com), you (&quot;User&quot;,
                  &quot;you&quot;) agree to the following legally binding terms.
                </p>
              </div>

              {/* Sections */}
              {sections.map((section, index) => (
                <section key={index} className="space-y-4">
                  <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <ChevronRight className="h-6 w-6 text-primary" />
                    {section.title}
                  </h2>
                  {section.content.map((paragraph, pIndex) => (
                    <div key={pIndex} className="space-y-4">
                      {paragraph.subtitle && (
                        <h3 className="text-xl font-medium mt-6 mb-3">
                          {paragraph.subtitle}
                        </h3>
                      )}
                      {paragraph.text.map((text, tIndex) => (
                        <p
                          key={tIndex}
                          className="text-muted-foreground leading-relaxed"
                        >
                          {text}
                        </p>
                      ))}
                      {paragraph.list && (
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                          {paragraph.list.map((item, lIndex) => (
                            <li key={lIndex} className="leading-relaxed">
                              {item}
                            </li>
                          ))}
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
                  <span>For questions or legal concerns, contact us at:</span>
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
  text: string[];
  list?: string[];
  text2?: string[];
}

interface Section {
  title: string;
  content: SectionContent[];
}

const sections: Section[] = [
  {
    title: "1. Platform Purpose & Disclaimer",
    content: [
      {
        text: [
          "KonnectSphere is a global platform designed to connect entrepreneurs with potential investors. We do not operate as a licensed financial advisor, broker, or investment firm, and we do not guarantee funding, returns, or business success.",
          "Users are solely responsible for conducting due diligence before making investment decisions or entering into agreements. KonnectSphere is not liable for any financial loss, fraud, or outcome resulting from user interactions.",
        ],
      },
    ],
  },
  {
    title: "2. User Eligibility",
    content: [
      {
        text: [
          "By accessing or using KonnectSphere, you represent and warrant that:",
        ],
        list: [
          "You are at least 18 years of age or the legal age of majority in your jurisdiction, whichever is greater.",
          "All personal, professional, and business information you submit is true, accurate, current, and complete.",
          "You are legally authorized to use online business and investment platforms under the laws of your country or region.",
          "You have full power and authority to enter into and comply with these Terms and Conditions.",
        ],
        text2: [
          "We reserve the right to suspend or terminate access if eligibility requirements are violated.",
        ],
      },
    ],
  },
  {
    title: "3. Subscriptions, Payments & Pitches",
    content: [
      {
        subtitle: "a. Entrepreneurs",
        text: [
          "Basic Plan: $49/month — Submit 1 pitch (visible within country).",
          "Premium Plan: $69/month — Submit up to 5 pitches (with global visibility).",
        ],
        list: [
          "Pitches cannot be edited, reused, or swapped after submission.",
          "To submit additional pitches beyond your plan’s limit, you must upgrade or purchase an additional subscription.",
        ],
      },
      {
        subtitle: "Non-Payment Policy:",
        text: [
          "If payment is not received, your pitch will be hidden from the platform.",
          "Reactivation requires full payment and renewal of your subscription.",
        ],
      },
      {
        subtitle: "b. Investors",
        text: [
          "Investor Subscription: $49/year — Full access to view all global pitches and use platform features.",
          "If payment is not received, you won't be able to use services.",
        ],
      },
      {
        subtitle: "c. Auto-Renewal",
        text: [
          "All subscriptions are set to auto-renew by default.",
          "By subscribing, you authorize KonnectSphere to automatically charge your registered payment method at each renewal cycle.",
          "You may manage or cancel your subscription at any time.",
          "Cancellations must be made prior to renewal to avoid charges for the next billing cycle.",
        ],
      },
    ],
  },
  {
    title: "4. No Refund Policy",
    content: [
      {
        text: [
          "KonnectSphere maintains a strict no-refund policy.",
          "All subscription fees are non-refundable, including but not limited to:",
        ],
        list: [
          "Partial or incomplete use of the services",
          "Accidental or mistaken subscription purchases",
          "Inactivity or failure to utilize the platform during the subscription period",
        ],
        text2: [
          "Unsubscribing from a service or deactivating your account will stop future billing cycles, but no past payments will be refunded under any circumstances.",
          "By subscribing, you acknowledge and agree to this policy.",
        ],
      },
    ],
  },
  {
    title: "5. Content Ownership & Promotional Use",
    content: [
      {
        text: [
          "By submitting content (including but not limited to pitches, photos, videos, business details, or personal profiles) to KonnectSphere, you grant KonnectSphere a worldwide, non-exclusive, royalty-free, irrevocable license to:",
        ],
        list: [
          "Display, publish, reproduce, and distribute your content across our platform.",
          "Feature your name, profile, image, business information, and pitch in marketing materials, advertisements, social media campaigns, email communications, or press releases.",
        ],
        text2: [
          "This license allows KonnectSphere to promote your pitch and enhance visibility for your business and opportunities.",
          "You expressly waive any rights to inspect, approve, or receive compensation related to how your content is used or presented in promotional activities.",
        ],
      },
    ],
  },
  {
    title: "6. Platform Integrity & Restrictions",
    content: [
      {
        text: [
          "To maintain a trustworthy and professional environment, all users of KonnectSphere agree to the following restrictions:",
        ],
        list: [
          "Do not post content that is fraudulent, misleading, defamatory, or illegal in nature.",
          "Do not impersonate any individual or entity, or create multiple accounts with false identities.",
          "Do not use the platform for spamming, phishing, solicitation scams, or any unethical or abusive behavior.",
        ],
        text2: [
          "KonnectSphere reserves the right to suspend, restrict, or permanently terminate access to any user account found in violation of these terms, without prior notice.",
        ],
      },
    ],
  },
  {
    title: "7. Limitation of Liability",
    content: [
      {
        text: ["To the maximum extent permitted by applicable law:"],
        list: [
          "KonnectSphere shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, goodwill, business opportunities, or data, arising out of or related to the use of our platform, even if we have been advised of the possibility of such damages.",
          "KonnectSphere disclaims any liability for the actions, content, investment decisions, communications, or contractual arrangements made between users on or through the platform.",
          "Users acknowledge that all interactions, agreements, investments, or collaborations are undertaken at their own risk, and KonnectSphere bears no responsibility for the outcomes of such engagements.",
          'The platform and its services are provided "as is" and "as available" without warranties of any kind, express or implied.',
          "Use of KonnectSphere is strictly at your own risk.",
        ],
      },
    ],
  },
  {
    title: "8. Platform Availability & Maintenance",
    content: [
      {
        text: [
          "KonnectSphere reserves the right to perform routine or emergency maintenance, upgrades, or changes to the Platform at any time, with or without prior notice.",
          "We strive to minimize downtime and, where possible, will notify users via email or platform announcements. However, we are not liable for any temporary inaccessibility, data loss, or service interruptions that may result.",
          "By using the Platform, you acknowledge and agree that such service disruptions do not constitute grounds for refunds, compensation, or legal claims.",
        ],
      },
    ],
  },
  {
    title: "9. Indemnification",
    content: [
      {
        text: [
          "You agree to fully indemnify, defend, and hold harmless KonnectSphere, including its affiliates, partners, directors, officers, and employees, from and against any and all claims, liabilities, losses, damages, expenses, or costs (including reasonable legal fees) resulting from or arising out of:",
        ],
        list: [
          "Your access to or use (or misuse) of the platform",
          "Any violation of these Terms and Conditions",
          "Any infringement of third-party rights, including intellectual property or privacy rights",
          "Any content submitted by you that causes harm to another user or third party",
        ],
        text2: [
          "This indemnity obligation survives the termination or deactivation of your account.",
        ],
      },
    ],
  },
  {
    title: "10. Account Termination",
    content: [
      {
        text: [
          "We reserve the right to suspend or permanently delete any account at our sole discretion, without notice, if we suspect the user is violating any of the Terms, engaging in fraudulent activities, or compromising the security and integrity of the Platform. Such suspension or deletion may be permanent, and no refunds or compensation will be provided for suspended or deleted accounts.",
          "Responsibility for Protection: It is user's responsibility to take appropriate measures to protect your intellectual property and personal information before sharing it on the Platform. This includes considering the use of non-disclosure agreements (NDAs), copyrights, trademarks, or any other legal protections available to you.",
        ],
      },
    ],
  },
  {
    title: "11. Intellectual Property and Content Responsibility",
    content: [
      {
        text: [
          "KonnectSphere is not responsible for any unauthorized use or theft of intellectual property, business ideas, images, brand elements, or other personal information shared by users on the platform. By using KonnectSphere, you agree that if another user (entrepreneur or investor) misuses your content, steals your idea, or uses your personal information (including images, brand name, or pitch content), KonnectSphere will not be held accountable or responsible for such actions.",
        ],
      },
    ],
  },
  {
    title: "12. Operates Under UAE Law",
    content: [
      {
        text: [
          "KonnectSphere operates as a licensed business entity within the United Arab Emirates and serves users globally. This Agreement shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to any conflict of law principles.",
          "Any disputes, claims, or controversies arising out of or relating to the use of KonnectSphere will be subject to the exclusive jurisdiction of the competent courts of the United Arab Emirates.",
          "By using KonnectSphere, users acknowledge and agree to waive any objections to venue, jurisdiction, or inconvenience of forum.",
        ],
      },
    ],
  },
  {
    title: "13. Account Deletion Consequences",
    content: [
      {
        text: [
          "Upon account deletion, all user data including profiles, pitches, connections, and payment history will be permanently erased. KonnectSphere is not responsible for retrieving or restoring any deleted content or information. Users acknowledge and accept this permanent removal.",
        ],
      },
    ],
  },
  {
    title: "14. Email Communication Policy",
    content: [
      {
        text: [
          "By creating an account on KonnectSphere, you consent to receive transactional and informational emails from us. These communications may include, but are not limited to:",
        ],
        list: [
          "Account notifications, password resets, and security alerts",
          "Subscription updates, billing information, and renewal reminders",
          "Platform updates, new features, and service announcements",
        ],
        text2: [
          "These emails are essential for your use of the Platform and cannot be unsubscribed from, as they relate directly to the operation, security, and legal obligations of your account.",
        ],
      },
      {
        subtitle: "Data Protection:",
        text: [
          "We do not sell, rent, or share your email address with third parties without your explicit consent, except as required to provide platform services or comply with the law.",
          "Email communications are safeguarded with secure transmission protocols and encryption wherever applicable.",
        ],
      },
      {
        subtitle: "User Responsibilities:",
        text: [
          "You are responsible for ensuring the email address associated with your account remains active and updated.",
          "KonnectSphere is not responsible for issues arising due to non-receipt of critical communications resulting from outdated or incorrect email information.",
        ],
      },
    ],
  },
  {
    title:
      "15. Compliance with UAE Consumer Protection Law and Data Protection Law",
    content: [
      {
        text: [
          "KonnectSphere complies with Federal Law No. 15 of 2020 on Consumer Protection issued by the United Arab Emirates.",
          "By using our platform, you acknowledge and agree to the following:",
        ],
        list: [
          "We are committed to transparent communication, fair billing, and clear information about your subscription.",
          "You will be informed of all pricing, features, renewal terms, and cancellation policies before any payment is charged.",
          "Your right to cancel or deactivate your subscription at any time is honored in accordance with our published policies.",
          "KonnectSphere does not engage in deceptive practices or misleading advertising, and all platform content is intended to accurately reflect our services.",
          "In the event of a dispute, KonnectSphere will cooperate fully with relevant UAE consumer protection authorities and legal entities.",
        ],
        text2: [
          "These Terms are governed by and construed in accordance with the laws of the United Arab Emirates, including but not limited to:",
          "Federal Law No. 15 of 2020 (Consumer Protection)",
          "Federal Decree-Law No. 45 of 2021 (Data Protection)",
          "Any disputes will be resolved exclusively in UAE courts. Users waive any objection to venue, jurisdiction, or forum inconvenience.",
          "We are committed to fair commercial practices, user protection, transparent pricing, and ethical data use in full compliance with UAE regulations.",
          "Users agree to use the platform in a lawful manner and in accordance with applicable UAE laws and regulations.",
        ],
      },
    ],
  },
  {
    title: "16. User Content Compliance with UAE Laws",
    content: [
      {
        text: [
          "By submitting or publishing any content on KonnectSphere, you agree to comply fully with the laws and cultural standards of the United Arab Emirates, including the UAE Cybercrime Law, Media Regulatory Guidelines, and relevant moral and religious codes.",
          "You are strictly prohibited from uploading, sharing, or promoting content that includes:",
        ],
        list: [
          "Material offensive to Islamic morals or religious beliefs",
          "Politically sensitive, defamatory, or anti-government remarks",
          "Obscene, pornographic, or violent visuals or language",
          "Promotion of alcohol, gambling, drugs, or banned substances",
          "Content that incites hate, racism, discrimination, or extremism",
          "False, misleading, or deceptive business pitches or claims",
          "Any material considered unethical or offensive under UAE public decency laws",
        ],
        text2: [
          "KonnectSphere reserves the right to review, restrict, or remove any content that violates UAE laws or ethical standards. Users who breach this clause may face account suspension or permanent termination, and where necessary, such cases may be reported to UAE authorities.",
        ],
      },
    ],
  },
  {
    title: "17. Dispute Resolution, Arbitration & Governing Law",
    content: [
      {
        text: [
          "KonnectSphere operates as a legally registered entity in the United Arab Emirates and serves a global user base. By using the platform, you acknowledge and accept the following legal framework:",
        ],
      },
      {
        subtitle: "Binding Arbitration",
        text: [
          "All disputes, claims, or controversies arising out of or relating to your use of KonnectSphere, these Terms, or any associated policies, shall be resolved exclusively through final and binding arbitration.",
          "Arbitration will be conducted under the rules of either the DIFC-LCIA Arbitration Centre or the ADGM Arbitration Centre, located in the UAE.",
          "Proceedings will be held in English, with a single arbitrator.",
          "The arbitrator’s decision shall be binding and enforceable in any court of competent jurisdiction.",
          "Each party will bear its own legal fees and arbitration costs unless the arbitrator rules otherwise.",
          "By accepting these Terms, you waive your right to litigate disputes in court, including the right to a jury trial or class action.",
        ],
      },
      {
        subtitle: "No Class Actions or Representative Proceedings",
        text: [
          "You agree to resolve disputes only on an individual basis. You specifically waive the right to:",
          "File or participate in any class, collective, or representative action;",
          "Consolidate claims with those of others;",
          "Act in a representative capacity on behalf of others in legal disputes.",
          "No court or arbitrator shall have authority to consolidate claims or to preside over any form of representative or class proceeding.",
        ],
      },
      {
        subtitle: "Waiver of Injunctive Relief",
        text: [
          "You agree that monetary damages shall be your sole remedy for any alleged breach by KonnectSphere.",
          "You irrevocably waive any right to seek injunctive or equitable relief (such as a court order requiring the platform to take or refrain from specific actions).",
        ],
      },
      {
        subtitle: "Governing Law & Jurisdiction",
        text: [
          "This Agreement is governed by the laws of the United Arab Emirates. Any legal matters not resolved through arbitration will fall under the exclusive jurisdiction of the UAE courts.",
          "By using KonnectSphere, you agree to waive any objections to jurisdiction, venue, or forum inconvenience under UAE law.",
        ],
      },
      {
        subtitle: "Third-Party Misuse Disclaimer",
        text: [
          "KonnectSphere is a neutral platform facilitating connections between users. While we provide basic tools for user safety and content reporting, we do not and cannot guarantee the protection of your intellectual property (e.g., business ideas, pitches, photos, branding) from misuse by other users.",
          "By using the platform, you acknowledge and agree that:",
          "KonnectSphere is not liable for any claims, damages, or losses arising from the unauthorized use, copying, or theft of your content by other users.",
          "Users are solely responsible for protecting their own intellectual property before sharing it publicly or with potential investors/entrepreneurs.",
          "If you believe your content has been misused, we encourage you to report it to us, and we may take action at our discretion — but legal responsibility remains with the parties involved, not KonnectSphere.",
        ],
      },
    ],
  },
  {
    title: "18. Contact",
    content: [
      {
        text: [
          "For questions or legal concerns, reach out to:",
          "📧 contact@konnectsphere.net",
        ],
      },
    ],
  },
];
