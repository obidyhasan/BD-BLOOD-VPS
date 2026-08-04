"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Link from "next/link";
import { motion } from "motion/react";
import { MessageCircleQuestion, Loader2 } from "lucide-react";
import { useGetAllFaqsQuery } from "@/redux/features/faqs/faqsApi";
import type { Faq } from "@/redux/features/faqs/faqsApi";

type FaqSectionProps = {
  initialFaqs?: Faq[];
};

const FaqSection = ({ initialFaqs }: FaqSectionProps) => {
  const number = "8801838482817";
  const { data, isLoading } = useGetAllFaqsQuery(
    { active: true, limit: 12, sortBy: "order", sortOrder: "asc" },
    { skip: !!initialFaqs?.length },
  );
  const faqItems = (initialFaqs ?? data?.data ?? []).slice(0, 12);
  const loading = !initialFaqs?.length && isLoading;

  return (
    <section
      id="faq-section"
      className="w-full py-10 md:py-16 bg-white dark:bg-zinc-950 scroll-mt-16"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-16 lg:flex-row">
          <div className="lg:w-1/3 space-y-6">
            <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase  border border-primary/20">
              <MessageCircleQuestion className="size-3.5" />
              <span>Support Hub</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-[0.95] uppercase">
              Commonly <br /> Asked{" "}
              <span className="text-primary">Questions</span>
            </h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed border-l border-primary/20 pl-3">
              Answers to common questions from our verified support network.
            </p>
            <Link
              href={`https://wa.me/${number}?text=Hello`}
              className="inline-flex h-12 items-center px-6 rounded-xl bg-primary/5 border border-primary/10 text-primary text-xs font-black uppercase  hover:bg-primary hover:text-white transition-all shadow-none"
            >
              Contact Support
            </Link>
          </div>

          <div className="lg:w-2/3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
              </div>
            ) : faqItems.length === 0 ? (
              <p className="text-muted-foreground font-medium">
                No FAQs published yet.
              </p>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-4">
                {faqItems.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <AccordionItem
                      value={`item-${item.id}`}
                      className="rounded-[2rem] border border-border/40 px-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-hidden"
                    >
                      <AccordionTrigger className="text-left font-black text-sm uppercase tracking-tight hover:no-underline py-6">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground font-medium leading-relaxed pb-6">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
