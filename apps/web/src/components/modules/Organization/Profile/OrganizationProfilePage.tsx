"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { useUpdateOrganizationProfileMutation } from "@/redux/features/organizations/organizationsApi";
import { toast } from "sonner";

export default function OrganizationProfilePage() {
  const { organization, organizationId } = useOrganizationDashboardContext();
  const [updateProfile, { isLoading }] = useUpdateOrganizationProfileMutation();

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organizationId) return;
    const values = new FormData(event.currentTarget);
    const phone = String(values.get("phone") ?? "");
    const email = String(values.get("email") ?? "");
    const address = String(values.get("address") ?? "");
    const description = String(values.get("description") ?? "");
    const logo = String(values.get("logo") ?? "");
    try {
      await updateProfile({
        id: organizationId,
        data: { phone, address, email: email || null, description: description || null, logo: logo || null },
      }).unwrap();
      toast.success("Public organization profile updated");
    } catch {
      toast.error("Profile update failed. Check the fields and try again.");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <DashboardHeader title="Organization Profile" subtitle="Maintain public contact details while structural identity remains protected." variant="clinical" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <Card className="rounded-[2.5rem] border-border/40">
          <CardHeader><CardTitle>Public information</CardTitle></CardHeader>
          <CardContent>
            <form key={organizationId ?? "loading"} onSubmit={save} className="grid gap-6 sm:grid-cols-2">
              {(["phone", "email", "address", "logo"] as const).map((field) => (
                <div key={field} className={field === "address" || field === "logo" ? "sm:col-span-2 space-y-2" : "space-y-2"}>
                  <Label htmlFor={field}>{field === "logo" ? "Logo URL" : field[0].toUpperCase() + field.slice(1)}</Label>
                  <Input name={field} id={field} type={field === "email" ? "email" : field === "logo" ? "url" : "text"} required={field === "phone" || field === "address"} defaultValue={organization?.[field] ?? ""} />
                </div>
              ))}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" id="description" maxLength={3000} rows={7} defaultValue={organization?.description ?? ""} />
              </div>
              <div className="sm:col-span-2"><Button type="submit" disabled={isLoading || !organizationId}>{isLoading ? "Saving…" : "Save profile"}</Button></div>
            </form>
          </CardContent>
        </Card>
        <Card className="h-fit rounded-[2.5rem] border-border/40 bg-muted/30">
          <CardHeader><CardTitle>Admin-controlled structure</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p><span className="font-semibold">Name:</span> {organization?.name ?? "—"}</p>
            <p><span className="font-semibold">Level:</span> {organization?.level ?? "UPAZILA"}</p>
            <p><span className="font-semibold">Location:</span> {[organization?.upazila?.name, organization?.district?.name, organization?.division?.name].filter(Boolean).join(", ") || "—"}</p>
            <p><span className="font-semibold">Verification:</span> {organization?.verificationStatus ?? "—"}</p>
            <p className="text-muted-foreground">Contact Super Admin to change geography, hierarchy, verification, status, organization name, or committee assignments.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
