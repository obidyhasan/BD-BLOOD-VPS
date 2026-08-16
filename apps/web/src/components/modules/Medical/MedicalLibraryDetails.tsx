import Link from "next/link";
import { ArrowLeft, BookOpen, Building2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type MedicalLibraryArticle = {
  title: string;
  content: string;
  category?: string | null;
  createdAt: string;
  institution?: {
    name: string;
    slug?: string | null;
  } | null;
};

export default function MedicalLibraryDetails({ article }: { article: MedicalLibraryArticle }) {
  return (
    <main className="min-h-screen bg-white px-6 pb-16 pt-28 dark:bg-zinc-950">
      <article className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" className="mb-8 rounded-full">
          <Link href="/medical">
            <ArrowLeft className="size-4" /> Back to Medical Library
          </Link>
        </Button>

        <header className="rounded-[2.5rem] border border-border/50 bg-card p-8 md:p-12">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge className="rounded-full px-4 py-1.5">
              <BookOpen className="mr-2 size-3.5" /> {article.category ?? "General"}
            </Badge>
            <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <CalendarDays className="size-4" />
              {new Date(article.createdAt).toLocaleDateString("en-BD", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{article.title}</h1>
          {article.institution && (
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Building2 className="size-4 text-primary" />
              {article.institution.slug ? (
                <Link className="hover:text-primary" href={`/medical/${article.institution.slug}`}>
                  {article.institution.name}
                </Link>
              ) : (
                article.institution.name
              )}
            </div>
          )}
        </header>

        <div className="mt-8 whitespace-pre-wrap rounded-[2.5rem] border border-border/50 bg-card p-8 text-base leading-8 text-foreground/85 md:p-12">
          {article.content}
        </div>
      </article>
    </main>
  );
}
