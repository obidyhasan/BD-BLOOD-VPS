"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  User, ShieldCheck,
  Save, KeyRound, MonitorSmartphone,
  ShieldAlert,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useUpdateMyProfileMutation } from "@/redux/features/donors/donorsApi";
import Link from "next/link";
import AvatarUpload from "@/components/ui/avatar-upload";

export default function AdminSettingsPage() {
  const { data: meData } = useGetMeQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();
  const me = meData?.data;

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const currentDisplayName = displayName || me?.fullName || "";
  const currentPhone = phone || me?.phone || "";

  const handleSave = async () => {
    if (!currentDisplayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("fullName", currentDisplayName.trim());
      if (currentPhone) fd.append("phone", currentPhone.trim());
      await updateProfile(fd).unwrap();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <DashboardHeader
          variant="clinical"
          title="Admin Settings"
          subtitle="Manage your admin profile, security, and system preferences."
          badge="Admin Core"
        />
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-14 px-8 rounded-2xl bg-red-500 text-white font-black text-[10px] uppercase  hover:bg-red-600 shadow-xl shadow-red-500/20 transition-all shrink-0"
        >
          {saving ? "Synchronizing..." : "Save All Changes"} <Save className="ml-2 size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Profile Card */}
          <Card className="rounded-[3rem] border-border/40 shadow-none overflow-hidden bg-white dark:bg-zinc-950">
            <CardContent className="p-10 space-y-10">
              <div className="flex items-center gap-6">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <User className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Identity & Profile</h3>
                  <p className="text-xs font-medium text-muted-foreground opacity-60 ">Update your administrative credentials and public appearance.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-5">
                <AvatarUpload
                  defaultAvatar={me?.profilePhoto ?? undefined}
                  className="shrink-0"
                />
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="text-2xl font-black tracking-tighter uppercase ">{me?.fullName ?? "Admin"}</h4>
                  <p className="text-xs font-bold text-muted-foreground opacity-60">{me?.role ?? "ADMIN"} • {me?.email}</p>

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">Display Name</Label>
                  <Input
                    className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold px-6 focus:ring-2 focus:ring-red-500/10 transition-all"
                    value={currentDisplayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">Secure Email</Label>
                  <Input
                    className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold px-6 opacity-60"
                    value={me?.email ?? ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">Phone</Label>
                  <Input
                    className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold px-6"
                    value={currentPhone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase  text-muted-foreground ml-1">Location</Label>
                  <Input
                    className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold px-6 opacity-60"
                    value={[me?.district?.name, me?.division?.name].filter(Boolean).join(", ") || "—"}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Protocols */}
          <Card className="rounded-[3rem] border-border/40 shadow-none overflow-hidden bg-white dark:bg-zinc-950">
            <CardContent className="p-10 space-y-10">
              <div className="flex items-center gap-6">
                <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Security & Access</h3>
                  <p className="text-xs font-medium text-muted-foreground opacity-60 ">Maintain the integrity of the administrative hub.</p>
                </div>
              </div>

              <div className="w-full p-6 rounded-[2rem] bg-amber-500/5 border border-dashed border-amber-500/20 flex items-center gap-6">
                <ShieldAlert className="size-8 text-amber-500 opacity-40 shrink-0" />
                <p className="text-xs font-bold text-amber-600/80 leading-relaxed uppercase  ">
                  Advanced multi-sig security modules are currently being synchronized across regional nodes.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-border/40 hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">Two-Factor Authentication</p>
                    <p className="text-[10px] font-medium text-muted-foreground opacity-60">Require a secure token for every root-level operation.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                </div>

                <div className="flex items-center justify-between p-6 rounded-2xl border border-dashed border-border/40 hover:bg-zinc-50 transition-colors cursor-pointer group">
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">Automatic Session Purge</p>
                    <p className="text-[10px] font-medium text-muted-foreground opacity-60">Terminate active sessions after 15 minutes of inactivity.</p>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-emerald-500" />
                </div>

                <Link href="/change-password">
                  <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-[10px] uppercase  border-border/40 hover:bg-zinc-100 w-full md:w-auto shadow-premium transition-all">
                    <KeyRound className="size-4 mr-2" />
                    Reset Root Password
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          {/* Active Session Info */}
          <Card className="rounded-[3rem] bg-zinc-950 text-white shadow-2xl overflow-hidden relative group border-none">
            <MonitorSmartphone className="absolute -bottom-10 -right-10 size-48 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
            <CardContent className="p-8 space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Active Session</h4>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-[9px] font-black uppercase text-white/30 ">Device Hash</p>
                  <p className="text-sm font-bold truncate">MacBook Pro M3 Max</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <p className="text-[9px] font-black uppercase text-white/30 ">IP Signature</p>
                  <p className="text-sm font-bold truncate">103.145.2.XX</p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
