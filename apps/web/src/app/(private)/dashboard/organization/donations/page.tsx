"use client";

import { useMemo } from "react";
import { CheckCircle2, Droplets, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganizationDashboardContext } from "@/hooks/useOrganizationDashboardContext";
import { extractErrorMessage } from "@/lib/apiError";
import {
    useGetOrganizationDonationsQuery,
    useRejectDonationMutation,
    useVerifyDonationMutation,
} from "@/redux/features/bloodDonations/bloodDonationsApi";

export default function OrganizationDonationsPage() {
    const { organizationId, organization } = useOrganizationDashboardContext();
    const { data, isLoading } = useGetOrganizationDonationsQuery(
        { organizationId, params: { limit: 250, sortBy: "createdAt", sortOrder: "desc" } },
        { skip: !organizationId },
    );
    const [verifyDonation, { isLoading: verifying }] = useVerifyDonationMutation();
    const [rejectDonation, { isLoading: rejecting }] = useRejectDonationMutation();
    const donations = useMemo(() => data?.data ?? [], [data?.data]);

    const verify = async (id: string) => {
        try {
            await verifyDonation({ id }).unwrap();
            toast.success("Donation verified. Cooldown, achievements, and request progress updated.");
        } catch (error: unknown) {
            toast.error(extractErrorMessage(error, "Failed to verify donation"));
        }
    };

    const reject = async (id: string) => {
        const reason = window.prompt("Why is this evidence being rejected?")?.trim();
        if (!reason || reason.length < 3) return;
        try {
            await rejectDonation({ id, reason }).unwrap();
            toast.info("Evidence rejected and assignment returned for correction.");
        } catch (error: unknown) {
            toast.error(extractErrorMessage(error, "Failed to reject donation"));
        }
    };

    return (
        <div className="space-y-8">
            <DashboardHeader
                variant="clinical"
                title="Donation Verification"
                subtitle={`Verify request-linked donation evidence for ${organization?.name ?? "your organization"}.`}
                badge="Jurisdiction Scoped"
            />

            {isLoading ? (
                <div className="flex justify-center py-24">
                    <Loader2 className="size-9 animate-spin text-primary" />
                </div>
            ) : donations.length === 0 ? (
                <Card className="rounded-[2.5rem] border-dashed shadow-none">
                    <CardContent className="p-16 text-center text-sm font-bold text-muted-foreground">
                        No donation evidence is available for this organization.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {donations.map((donation) => (
                        <Card key={donation.id} className="rounded-3xl border-border/40 shadow-none">
                            <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
                                    <Droplets className="size-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-black">{donation.donor.fullName}</p>
                                        <Badge variant="outline" className="font-black">
                                            {donation.donor.bloodGroup.groupName}
                                        </Badge>
                                        <Badge variant="outline" className="font-black">
                                            {donation.verificationStatus}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                                        {donation.hospitalName} · {new Date(donation.donationDate).toLocaleDateString()}
                                    </p>
                                    {donation.notes && (
                                        <p className="mt-2 text-xs text-muted-foreground">{donation.notes}</p>
                                    )}
                                </div>
                                {donation.verificationStatus === "PENDING" && (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            disabled={verifying || rejecting}
                                            className="rounded-xl font-black text-red-600"
                                            onClick={() => reject(donation.id)}
                                        >
                                            <XCircle className="mr-2 size-4" /> Reject
                                        </Button>
                                        <Button
                                            disabled={verifying || rejecting}
                                            className="rounded-xl font-black"
                                            onClick={() => verify(donation.id)}
                                        >
                                            <CheckCircle2 className="mr-2 size-4" /> Verify
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
