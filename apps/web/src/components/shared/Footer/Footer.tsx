"use client";

import Link from "next/link";
import { footerSectionsData, socialLinks } from "@/lib/siteContent";
import { BDLogo } from "@/components/ui/bd-logo";
import { ShieldCheck, ArrowUpRight, Globe, Mail, Phone, Zap } from "lucide-react";

const Footer = () => {

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative w-full bg-zinc-950 text-white overflow-hidden pt-16 pb-6">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 size-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-20 mb-10">
          {/* Brand Engine */}
          <div className="lg:col-span-4 space-y-8">
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
              <BDLogo size="lg" variant="light" />
            </Link>
            <div className="space-y-6">
              <p className="text-white/40 text-base font-medium leading-relaxed max-w-sm">
                Connecting life-savers. We bridge the critical gap between donors and those in need,
                leveraging mission-grade technology across Bangladesh.
              </p>
              <div className="flex items-center gap-3">
                {socialLinks.map(({ icon: Icon, href, target }) => (
                  <Link
                    key={href}
                    href={href}
                    className="size-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 text-white/40 transition-all hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-2 shadow-2xl"
                    target={target}
                  >
                    <Icon className="size-5" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation Protocol */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-10">
            {footerSectionsData.map(({ title, links }) => (
              <div key={title} className="space-y-8">
                <h4 className="text-white font-black text-xs uppercase opacity-20">{title}</h4>
                <ul className="space-y-4">
                  {links.map(({ title, href }) => (
                    <li key={title}>
                      <Link
                        href={href}
                        className="text-white/50 hover:text-primary transition-all duration-300 flex items-center gap-3 group text-sm font-bold"
                      >
                        <ArrowUpRight className="size-3 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                        {title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Secure Hub */}
          <div className="lg:col-span-4 space-y-10">
            <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl relative group overflow-hidden">
              <ShieldCheck className="absolute -bottom-6 -right-6 size-32 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                <h4 className="text-white font-black text-xs uppercase  flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Support
                </h4>
                <div className="space-y-5">
                  <div className="flex items-center gap-4 group/item">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover/item:text-primary transition-colors">
                      <Phone className="size-4" />
                    </div>
                    <span className="text-sm font-bold  text-white/60 tracking-wider">+880 1838-482817</span>
                  </div>
                  <div className="flex items-center gap-4 group/item">
                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover/item:text-primary transition-colors">
                      <Mail className="size-4" />
                    </div>
                    <span className="text-sm font-bold  text-white/60 tracking-wider">ops@bdblood.com</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-primary/10 border border-primary/20">
              <Zap className="size-4 text-primary animate-bounce" />
              <p className="text-[10px] font-black uppercase  text-primary">Emergency Hotlines Active 24/7</p>
            </div>
          </div>
        </div>

        {/* Global Footer Ledger */}
        <div className="pt-6 border-t border-white/5 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20">
              <Globe className="size-4" />
            </div>
            <p className="text-white/20 text-xs font-black uppercase">
              &copy; {currentYear} BD Blood. All Rights Reserved.
            </p>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase text-white/20 ">Powered By</span>
              <Link
                className="text-white/40 hover:text-primary transition-all font-black text-xs uppercase tracking-tighter "
                href="https://www.code2launch.co"
                target="_blank"
              >
                code2launch
              </Link>
            </div>
            <div className="size-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/10 group hover:text-primary transition-all cursor-pointer">
              <Link href="https://www.code2launch.co" target="_blank"><ArrowUpRight className="size-5 group-hover:rotate-45 transition-transform" /></Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
