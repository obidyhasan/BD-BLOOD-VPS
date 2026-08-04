"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ReportTargetType,
  useCreateReportMutation,
} from "@/redux/features/reports/reportsApi";
import { extractErrorMessage } from "@/lib/apiError";

type SubmitReportDialogProps = {
  triggerLabel?: React.ReactNode;
  triggerClassName?: string;
  defaultTargetType?: ReportTargetType;
  defaultTargetId?: string;
};

const targetTypeOptions: { value: ReportTargetType; label: string }[] = [
  { value: "DONOR", label: "Donor Profile" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "POST", label: "Post / Content" },
  { value: "EVENT", label: "Event" },
];

const SubmitReportDialog = ({
  triggerLabel,
  triggerClassName,
  defaultTargetType,
  defaultTargetId,
}: SubmitReportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<ReportTargetType>(
    defaultTargetType ?? "POST",
  );
  const [targetId, setTargetId] = useState(defaultTargetId ?? "");
  const [reason, setReason] = useState("");
  const [createReport, { isLoading }] = useCreateReportMutation();

  const handleSubmit = async () => {
    if (!targetId.trim()) {
      toast.error("Please enter an ID");
      return;
    }
    if (reason.trim().length < 10) {
      toast.error("Please provide a detailed reason (at least 10 characters)");
      return;
    }

    try {
      await createReport({
        targetType,
        targetId: targetId.trim(),
        reason: reason.trim(),
      }).unwrap();
      toast.success("Report submitted for review");
      setOpen(false);
      setReason("");
      if (!defaultTargetId) setTargetId("");
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to submit report"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "h-14 px-8 rounded-2xl bg-zinc-950 text-white font-black text-[10px] uppercase  hover:bg-zinc-900 shadow-xl transition-all",
            triggerClassName,
          )}
        >
          {triggerLabel ?? (
            <>
              <Flag className="mr-2 size-4 text-emerald-500" /> Submit Report
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl rounded-[2.5rem] p-10 border-border/40 shadow-premium">
        <DialogHeader className="space-y-2 text-left">
          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
            Submit a Report
          </DialogTitle>
          <DialogDescription className="text-sm font-medium text-muted-foreground">
            Flag content or behavior that violates community guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase  text-muted-foreground">
              Report Type
            </Label>
            <Select
              value={targetType}
              onValueChange={(v) => setTargetType(v as ReportTargetType)}
              disabled={!!defaultTargetType}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targetTypeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase  text-muted-foreground">
              ID
            </Label>
            <Input
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Enter the ID of the content or profile"
              className="h-12 rounded-xl"
              disabled={!!defaultTargetId}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase  text-muted-foreground">
              Reason
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="min-h-28 rounded-xl resize-none"
            />
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-4 pt-4">
          <Button
            variant="outline"
            className="h-12 rounded-xl font-black text-xs uppercase "
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className="h-12 rounded-xl font-black text-xs uppercase "
            onClick={() => void handleSubmit()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitReportDialog;
