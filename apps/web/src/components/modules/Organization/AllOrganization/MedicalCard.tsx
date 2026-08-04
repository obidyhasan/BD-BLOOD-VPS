import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ArrowUpRight, MapPin, Phone, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const MedicalCard = () => {
  return (
    <Link href={"/medical/khulna-medical-college"} className="group block">
      <div className="rounded-[2rem] border border-border/40 bg-zinc-50 dark:bg-zinc-900/50 p-3 transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden">
        {/* Hover Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Image Container */}
        <div className="relative w-full h-48 overflow-hidden rounded-[1.5rem]">
          <Image
            src="/blogs/cloud.jpg"
            alt="Medical Facility"
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className="bg-emerald-500 border-none rounded-full px-3 py-1 text-[9px] font-black uppercase  text-white shadow-lg flex items-center gap-1.5">
              <ShieldCheck className="size-3" />
              Verified
            </Badge>
          </div>

          {/* Bottom Overlay text for Image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase  backdrop-blur-md bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
              <Activity className="size-3 text-emerald-400" />
              <span>Blood Bank Active</span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-black text-lg sm:text-xl text-foreground tracking-tight group-hover:text-primary transition-colors ">
              Khulna Medical College
            </h3>
            <div className="flex items-center gap-2 mt-3 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5 text-emerald-500 shrink-0" />
              Khulna, BD
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs font-medium text-muted-foreground">
              <Phone className="size-3.5 text-emerald-500 shrink-0" />
              Emergency: 24/7 Access
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-border/40">
            <div className="text-[10px] font-black uppercase  text-muted-foreground opacity-60">
              Tertiary Care Node
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-4 rounded-full font-black text-[10px] uppercase  group-hover:bg-primary group-hover:text-white transition-all duration-300">
              View Details
              <ArrowUpRight className="ml-1.5 size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MedicalCard;
