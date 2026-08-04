import {
  Users,
  HeartPulse,
  Droplets,
  Globe,
  Target,
  ShieldCheck,
  Heart,
  MailIcon,
  MapPinIcon,
  MessageCircle,
  PhoneIcon,
} from "lucide-react";
import {
  Facebook,
  GithubIcon,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  TwitterIcon,
} from "lucide-react";

export const heroContent = {
  badge: "Bangladesh No.1 Blood Network",
  title: {
    line1: "GIVE",
    span1: "BLOOD",
    line2: "SAVE",
    span2: "LIFE",
  },
  description:
    "Join Bangladesh's most trusted blood donation platform. We connect heroes with those in need, making the process safe and fast.",
};

export const homeStatsConfig = [
  {
    label: "Donors Joined",
    icon: Users,
    trendKey: "donors" as const,
    description: "Active community members",
    color: "text-primary",
    bg: "bg-primary/5",
  },
  {
    label: "Success Matches",
    icon: HeartPulse,
    trendKey: "fulfilled" as const,
    description: "Lives impacted directly",
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
  },
  {
    label: "Verified Organizations",
    icon: Droplets,
    trendKey: "orgs" as const,
    description: "Partner organizations",
    color: "text-red-500",
    bg: "bg-red-500/5",
  },
  {
    label: "Covered Areas",
    icon: Globe,
    trendKey: "districts" as const,
    description: "Districts across Bangladesh",
    color: "text-amber-500",
    bg: "bg-amber-500/5",
  },
];

export const philosophyItems = [
  {
    icon: Target,
    title: "Precision",
    desc: "Finding the right blood group in the closest location instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Verified",
    desc: "Every donor in our system is manually verified for safety.",
  },
  {
    icon: Globe,
    title: "Accessible",
    desc: "Serving all districts including rural areas.",
  },
  {
    icon: Heart,
    title: "Compassion",
    desc: "Built by volunteers for the community with pure empathy.",
  },
];

export const contactItems = [
  {
    icon: MailIcon,
    title: "Email",
    description: "Our team is here to help with any questions.",
    value: "support@bdblood.com",
    href: "mailto:support@bdblood.com",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Get instant support through WhatsApp.",
    value: "Start new chat",
    href: "https://wa.me/8801838482817?text=Hello%20I%20am%20interested",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: MapPinIcon,
    title: "Office",
    description: "Visit our headquarters in Khulna.",
    value: "Khulna, Bangladesh",
    href: "https://www.google.com/maps?q=Khulna,+Bangladesh",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: PhoneIcon,
    title: "Phone",
    description: "Mon-Fri from 9am to 6pm.",
    value: "+880 1838 482817",
    href: "tel:+8801838482817",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export type NavLink = {
  label: string;
  href: string;
  sectionId?: string;
  isExternal?: boolean;
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "/", isExternal: true },
  { label: "Organization", href: "/organization", isExternal: true },
  { label: "Medical", href: "/medical", isExternal: true },
  { label: "Donor", href: "/donor", isExternal: true },
  { label: "Blog", href: "/blog", isExternal: true },
  { label: "Event", href: "/event", isExternal: true },
  { label: "Gallery", href: "/gallery", isExternal: true },
];

export const footerSectionsData = [
  {
    title: "Quick Links",
    links: [
      { title: "Organization", href: "/organization" },
      { title: "Medical", href: "/medical" },
      { title: "Donor", href: "/donor" },
      { title: "Blog", href: "/blog" },
      { title: "Event", href: "/event" },
      { title: "Gallery", href: "/gallery" },
    ],
  },
  {
    title: "Useful",
    links: [
      { title: "FAQ", href: "/#faq-section" },
      { title: "Privacy Policy", href: "/policy" },
      { title: "Terms & Conditions", href: "/terms-and-conditions" },
      {
        title: "Support",
        href: "https://wa.me/8801838482817?text=Hello%20I%20am%20interested",
      },
    ],
  },
];

export const contactInfo = [
  {
    icon: Mail,
    text: "support@bdblood.com",
    href: "mailto:support@bdblood.com",
  },
  {
    icon: Phone,
    text: "+880 1838 482817",
    href: "tel:+8801838482817",
  },
  {
    icon: MapPin,
    text: "Khulna, Bangladesh",
    href: "https://www.google.com/maps?q=Khulna,+Bangladesh",
  },
];

export const socialLinks = [
  {
    icon: GithubIcon,
    href: "https://github.com/code2launch",
    target: "_blank",
  },
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/company/code-2-launch",
    target: "_blank",
  },
  {
    icon: TwitterIcon,
    href: "https://x.com/code2launch",
    target: "_blank",
  },
  {
    icon: Facebook,
    href: "https://www.facebook.com/code2launch",
    target: "_blank",
  },
];

export function formatStatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return k >= 10 ? `${Math.round(k)}K+` : `${k.toFixed(1).replace(/\.0$/, "")}K+`;
  }
  return n.toLocaleString();
}
