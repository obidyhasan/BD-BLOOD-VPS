"use client";

import { useState } from "react";
import { Loader2, Search, MapPin, Droplets } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLazyTrackBloodRequestQuery } from "@/redux/features/bloodRequests/bloodRequestsApi";
import { extractErrorMessage } from "@/lib/apiError";

export default function TrackBloodRequestPage() {
    const [referenceCode, setReferenceCode] = useState("");
    const [phoneSuffix, setPhoneSuffix] = useState("");
    const [track, { data, isFetching }] = useLazyTrackBloodRequestQuery();
    const request = data?.data;

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!referenceCode.trim() || phoneSuffix.replace(/\D/g, "").length < 4) {
            toast.error("Enter the reference code and at least the last four phone digits.");
            return;
        }
        try {
            await track({
                referenceCode: referenceCode.trim(),
                phoneSuffix: phoneSuffix.trim(),
            }).unwrap();
        } catch (error: unknown) {
            toast.error(extractErrorMessage(error, "Request tracking was not found"));
        }
    };

    return (
        <main className="mx-auto w-full max-w-5xl px-4 py-12 md:px-6 md:py-16">
            <div className="border-b border-border/50 pb-8">
                <p className="text-xs font-black uppercase text-red-600">Blood Request</p>
                <h1 className="mt-2 text-3xl font-black md:text-4xl">Track Request</h1>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    Use the reference from your submission and the requester phone suffix.
                </p>
            </div>

            <form onSubmit={submit} className="grid gap-4 border-b border-border/50 py-8 md:grid-cols-[1fr_1fr_auto]">
                <Input
                    value={referenceCode}
                    onChange={(event) => setReferenceCode(event.target.value)}
                    placeholder="Reference code"
                    className="h-12 rounded-md"
                />
                <Input
                    value={phoneSuffix}
                    onChange={(event) => setPhoneSuffix(event.target.value)}
                    placeholder="Last 4 or more phone digits"
                    inputMode="numeric"
                    className="h-12 rounded-md"
                />
                <Button type="submit" disabled={isFetching} className="h-12 rounded-md px-6">
                    {isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                    Track
                </Button>
            </form>

            {request && (
                <section className="py-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground">{request.referenceCode}</p>
                            <h2 className="mt-1 text-2xl font-black">{request.hospitalName}</h2>
                        </div>
                        <Badge variant="outline" className="rounded-md px-3 py-1 font-black">
                            {request.status.replaceAll("_", " ")}
                        </Badge>
                    </div>

                    <div className="mt-6 grid gap-4 border-y border-border/50 py-6 sm:grid-cols-2 lg:grid-cols-4">
                        <Metric label="Blood" value={request.bloodGroup.groupName} icon={Droplets} />
                        <Metric label="Required" value={`${request.assignmentSummary.requiredBags} bags`} />
                        <Metric label="Committed" value={`${request.assignmentSummary.committedBags} bags`} />
                        <Metric label="Verified" value={`${request.assignmentSummary.fulfilledBags} bags`} />
                    </div>

                    <p className="mt-5 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <MapPin className="size-4" />
                        {[request.upazila.name, request.district.name, request.division.name].join(", ")}
                    </p>

                    <div className="mt-8 space-y-0 border-l-2 border-border">
                        {request.statusHistory.map((item) => (
                            <div key={`${item.newStatus}-${item.createdAt}`} className="relative pb-6 pl-6 last:pb-0">
                                <span className="absolute -left-[7px] top-1 size-3 rounded-full bg-red-600 ring-4 ring-background" />
                                <p className="text-sm font-black">{item.newStatus.replaceAll("_", " ")}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {new Date(item.createdAt).toLocaleString()}
                                    {item.reason ? ` · ${item.reason}` : ""}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}

function Metric({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon?: typeof Droplets;
}) {
    return (
        <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">{label}</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-black">
                {Icon && <Icon className="size-4 text-red-600" />}
                {value}
            </p>
        </div>
    );
}
