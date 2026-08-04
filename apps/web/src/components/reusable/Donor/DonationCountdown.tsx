"use client";

import { useEffect, useState } from "react";
import {
  formatDistanceToNow,
  isAfter,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";
import { motion } from "motion/react";
import { Timer, Droplets, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DonationCountdownProps {
  lastDonationDate?: string | Date;
  // Server-computed eligibility date (donationDate + 3 months, and kept in
  // sync with Donor.availabilityStatus by the backend). This is the source
  // of truth for the countdown; the frontend only formats it, it doesn't
  // compute it.
  nextEligibleDonationDate?: string | Date;
  className?: string;
}

type CountdownState = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEligible: boolean;
  progress: number;
} | null;

const computeTimeLeft = (
  lastDonationDate?: string | Date,
  nextEligibleDonationDate?: string | Date,
): CountdownState => {
  if (!nextEligibleDonationDate) return null;

  const nextEligibleDate = new Date(nextEligibleDonationDate);
  const lastDate = lastDonationDate ? new Date(lastDonationDate) : null;
  const now = new Date();

  if (isAfter(now, nextEligibleDate)) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isEligible: true,
      progress: 100,
    };
  }

  const diffDays = differenceInDays(nextEligibleDate, now);
  const diffHours = differenceInHours(nextEligibleDate, now) % 24;
  const diffMinutes = differenceInMinutes(nextEligibleDate, now) % 60;
  const diffSeconds = differenceInSeconds(nextEligibleDate, now) % 60;

  // Calculate progress percentage. Falls back to just the remaining
  // time (no 0-100 ramp) if we don't have a start date to anchor to.
  const progress = lastDate
    ? Math.min(
      Math.max(
        ((now.getTime() - lastDate.getTime()) /
          (nextEligibleDate.getTime() - lastDate.getTime())) *
        100,
        0,
      ),
      100,
    )
    : 0;

  return {
    days: diffDays,
    hours: diffHours,
    minutes: diffMinutes,
    seconds: diffSeconds,
    isEligible: false,
    progress,
  };
};

export const DonationCountdown = ({
  lastDonationDate,
  nextEligibleDonationDate,
  className,
}: DonationCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<CountdownState>(() =>
    computeTimeLeft(lastDonationDate, nextEligibleDonationDate),
  );

  // Re-derive the initial value during render (not in an effect) whenever
  // the source dates change, following React's "adjusting state during
  // render" pattern instead of syncing state via an effect.
  const dateKey = `${lastDonationDate ?? ""}|${nextEligibleDonationDate ?? ""}`;
  const [prevDateKey, setPrevDateKey] = useState(dateKey);
  if (dateKey !== prevDateKey) {
    setPrevDateKey(dateKey);
    setTimeLeft(computeTimeLeft(lastDonationDate, nextEligibleDonationDate));
  }

  // The effect only subscribes to the ticking clock (an external system);
  // the recurring setState happens inside the interval callback, not
  // synchronously in the effect body.
  useEffect(() => {
    if (!nextEligibleDonationDate) return;

    const timer = setInterval(() => {
      setTimeLeft(computeTimeLeft(lastDonationDate, nextEligibleDonationDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [lastDonationDate, nextEligibleDonationDate]);

  if (!nextEligibleDonationDate) return null;
  if (!timeLeft || timeLeft.isEligible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn("w-full", className)}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-zinc-900 to-black text-white shadow-2xl rounded-[2.5rem]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px] -ml-24 -mb-24" />

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
          {/* Visual Indicator */}
          <div className="relative flex-shrink-0">
            <div className="size-32 md:size-40 rounded-full border-4 border-white/10 flex items-center justify-center relative overflow-hidden">
              <svg className="size-full -rotate-90 transform">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="100 100"
                  className="text-white/5"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${timeLeft.progress} 100`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Droplets className="size-8 text-primary mb-1 fill-current" />
                <span className="text-2xl font-black">
                  {Math.round(timeLeft.progress)}%
                </span>
                <span className="text-[10px] font-bold uppercase  opacity-60">
                  Ready
                </span>
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20">
                <Timer className="size-3" />
                <span className="text-[10px] font-black uppercase ">
                  Recovery Time
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tighter leading-tight">
                Your body is <span className="text-primary">getting ready</span>{" "}
                to save lives again.
              </h3>
              <p className="text-zinc-400 font-medium text-sm md:text-base max-w-lg">
                To keep you healthy, you need to wait 3 months between
                donations.
              </p>
            </div>

            {/* Countdown Grid */}
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto md:mx-0">
              {[
                { label: "Days", val: timeLeft.days },
                { label: "Hrs", val: timeLeft.hours },
                { label: "Min", val: timeLeft.minutes },
                { label: "Sec", val: timeLeft.seconds },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="bg-white/5 rounded-2xl p-3 border border-white/10 backdrop-blur-sm flex flex-col items-center"
                >
                  <span className="text-xl md:text-2xl font-black text-white leading-none">
                    {unit.val.toString().padStart(2, "0")}
                  </span>
                  <span className="text-[8px] font-black uppercase  text-primary mt-1">
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action/Info */}
          <div className="flex-shrink-0 w-full md:w-auto">
            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                  <AlertCircle className="size-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase  text-zinc-500">
                    Next Donation Date
                  </span>
                  <span className="text-sm font-bold text-white">
                    {formatDistanceToNow(new Date(nextEligibleDonationDate), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] font-medium text-zinc-500 ">
                  &quot;You cannot donate now, but you can still help by sharing
                  blood posts!&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
