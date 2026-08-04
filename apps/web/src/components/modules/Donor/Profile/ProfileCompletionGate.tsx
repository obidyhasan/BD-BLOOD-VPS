"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import EditProfileForm from "./EditProfileForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetMeQuery } from "@/redux/features/auth/authApi";

const FIELD_LABELS: Record<string, string> = {
    fullName: "Full name",
    phone: "Phone number",
    emailVerified: "Verified email",
    bloodGroupId: "Blood group",
    divisionId: "Division",
    districtId: "District",
    upazilaId: "Upazila",
    geographicAncestry: "Valid geographic selection",
    affiliation: "Local organization affiliation",
};

export function ProfileCompletionGate() {
    const { data, isLoading } = useGetMeQuery();
    const user = data?.data;
    const incomplete = user?.profileStatus === "INCOMPLETE";
    const missing = user?.missingProfileFields ?? [];

    if (isLoading || !incomplete) return null;

    return (
        <Dialog open modal>
            <DialogContent
                showCloseButton={false}
                onEscapeKeyDown={(event) => event.preventDefault()}
                onInteractOutside={(event) => event.preventDefault()}
                className="max-h-[92vh] overflow-hidden rounded-2xl border-border/50 p-0 sm:max-w-3xl"
            >
                <div className="border-b border-border/40 bg-red-500/5 p-6 md:p-8">
                    <DialogHeader className="text-left">
                        <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                            <AlertCircle className="size-5" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Complete donor profile</DialogTitle>
                        <DialogDescription className="max-w-2xl">
                            Your profile must be complete and affiliated with your local organization before you can accept blood requests or submit donations.
                        </DialogDescription>
                    </DialogHeader>

                    {missing.length > 0 && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {missing.map((field) => (
                                <span
                                    key={field}
                                    className="rounded-md border border-red-500/15 bg-background px-2.5 py-1 text-xs font-bold text-red-700"
                                >
                                    {FIELD_LABELS[field] ?? field}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="max-h-[64vh] overflow-y-auto p-6 md:p-8">
                    {user ? (
                        <EditProfileForm dialogOpen />
                    ) : (
                        <div className="flex h-32 items-center justify-center">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
