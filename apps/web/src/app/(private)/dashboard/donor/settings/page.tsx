"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Lock, Bell, ShieldCheck, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useDeleteMyAccountMutation,
  useUpdateMyProfileMutation,
} from "@/redux/features/donors/donorsApi";
import { logout, updateUser } from "@/redux/features/auth/authSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useRouter } from "next/navigation";
import { useSessionUser } from "@/hooks/useSessionUser";
import { extractErrorMessage } from "@/lib/apiError";

export default function DonorSettingsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { me } = useSessionUser();
  const [deleteMyAccount, { isLoading: isDeleting }] =
    useDeleteMyAccountMutation();
  const [updateProfile, { isLoading: isSaving }] = useUpdateMyProfileMutation();

  const notifyInApp = me?.notifyInApp ?? true;
  const notifySms = me?.notifySms ?? true;
  const notifyEmail = me?.notifyEmail ?? false;

  const savePreferences = async (patch: {
    notifyInApp?: boolean;
    notifySms?: boolean;
    notifyEmail?: boolean;
  }) => {
    try {
      const formData = new FormData();
      if (patch.notifyInApp !== undefined)
        formData.append("notifyInApp", String(patch.notifyInApp));
      if (patch.notifySms !== undefined)
        formData.append("notifySms", String(patch.notifySms));
      if (patch.notifyEmail !== undefined)
        formData.append("notifyEmail", String(patch.notifyEmail));

      const result = await updateProfile(formData).unwrap();
      if (result.data) {
        dispatch(updateUser(result.data));
      }
      toast.success("Notification preferences saved");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to save preferences"));
    }
  };

  const handleToggle = async (
    key: "notifyInApp" | "notifySms" | "notifyEmail",
    value: boolean,
  ) => {
    await savePreferences({ [key]: value });
  };

  const handleDeleteProfile = async () => {
    try {
      await deleteMyAccount().unwrap();
      dispatch(logout());
      toast.success("Account deleted successfully");
      router.push("/");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="space-y-10">
      <DashboardHeader
        variant="clinical"
        title="Settings"
        subtitle="Manage your password, notifications, and keep your account safe."
        badge="Settings"
      />

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden bg-white dark:bg-zinc-950">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase">
                    Security & Access
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground opacity-60">
                    Manage how you access your donor profile.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Link href="/change-password">
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl font-black text-[10px] uppercase border-border/40 hover:bg-zinc-50 w-full md:w-auto"
                  >
                    <Lock className="size-3.5 mr-2" />
                    Change Password
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-border/40 shadow-none overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Bell className="size-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase">
                    Message Alerts
                  </h3>
                  <p className="text-xs font-medium text-muted-foreground opacity-60">
                    Choose how you want to be notified about blood requests.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    App Notifications
                  </Label>
                  <Switch
                    checked={notifyInApp}
                    disabled={true}
                    onCheckedChange={(v) => void handleToggle("notifyInApp", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Text Messages (SMS via MiM SMS)
                  </Label>
                  <Switch
                    checked={notifySms}
                    disabled={true}
                    onCheckedChange={(v) => void handleToggle("notifySms", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Email Updates
                  </Label>
                  <Switch
                    checked={notifyEmail}
                    disabled={true}
                    onCheckedChange={(v) => void handleToggle("notifyEmail", v)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex flex-col items-start justify-between gap-6 p-6 rounded-[2.5rem] bg-red-500/5 border border-red-500/10">
            <div>
              <h4 className="text-lg font-black text-red-500 uppercase">
                Close Account
              </h4>
              <p className="mt-4 text-xs font-medium text-red-500/60 max-w-sm">
                Permanently delete your profile from our system. This cannot be
                undone.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black text-[10px] uppercase h-12 px-6"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] border-border/40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">
                    Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm font-medium text-muted-foreground">
                    This action cannot be undone. This will permanently delete
                    your donor profile and remove your data from our active
                    blood donor network.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3">
                  <AlertDialogCancel className="h-12 rounded-2xl border-border/40 font-bold text-xs uppercase ">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteProfile}
                    disabled={isDeleting}
                    className="h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-bold text-xs uppercase  border-none"
                  >
                    {isDeleting ? "Deleting..." : "Confirm Account Deletion"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
