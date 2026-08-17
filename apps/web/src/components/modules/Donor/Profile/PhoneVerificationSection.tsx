"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useSendPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
} from "@/redux/features/auth/authApi";

type Props = {
  phone: string;
  verifiedPhone?: string | null;
  phoneVerifiedAt?: string | null;
};

const normalizePhone = (value: string) => value.replace(/\D/g, "");

export function PhoneVerificationSection({ phone, verifiedPhone, phoneVerifiedAt }: Props) {
  const [otp, setOtp] = useState("");
  const [sendOtp, { isLoading: sending }] = useSendPhoneOtpMutation();
  const [verifyOtp, { isLoading: verifying }] = useVerifyPhoneOtpMutation();

  const isVerified = Boolean(
    phoneVerifiedAt && normalizePhone(phone) === normalizePhone(verifiedPhone ?? ""),
  );

  const handleSendOtp = async () => {
    const normalized = normalizePhone(phone);
    if (!/^01[3-9]\d{8}$/.test(normalized)) {
      toast.error("Enter a valid phone number first.");
      return;
    }
    try {
      const res = await sendOtp({ phone: normalized }).unwrap();
      toast.success(res.message || "OTP sent. Check server logs in development.");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to send OTP.";
      toast.error(message);
    }
  };

  const handleVerify = async () => {
    const normalized = normalizePhone(phone);
    if (!otp.trim()) {
      toast.error("Enter the OTP code.");
      return;
    }
    try {
      const res = await verifyOtp({
        phone: normalized,
        otp: otp.trim(),
      }).unwrap();
      toast.success(res.message || "Phone verified!");
      setOtp("");
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Invalid or expired OTP.";
      toast.error(message);
    }
  };

  if (isVerified) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
        <ShieldCheck className="size-4 text-emerald-500" />
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
          Phone verified
        </span>
        <Badge className="ml-auto rounded-full bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] font-black uppercase">
          Verified
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border/40 bg-zinc-50 dark:bg-zinc-900 p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Verify your phone to receive urgent blood request SMS alerts.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl font-bold text-xs uppercase"
          disabled={sending}
          onClick={handleSendOtp}
        >
          {sending ? <Loader2 className="size-3 animate-spin" /> : "Send OTP"}
        </Button>
        <Input
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          className="h-9 max-w-[140px] rounded-xl font-mono text-sm"
          maxLength={6}
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        <Button
          type="button"
          size="sm"
          className="rounded-xl font-bold text-xs uppercase"
          disabled={verifying}
          onClick={handleVerify}
        >
          {verifying ? <Loader2 className="size-3 animate-spin" /> : "Verify"}
        </Button>
      </div>
    </div>
  );
}
