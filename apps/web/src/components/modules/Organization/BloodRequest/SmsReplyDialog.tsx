"use client";

import { extractErrorMessage } from "@/lib/apiError";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useSendBloodRequestSmsMutation } from "@/redux/features/bloodRequests/bloodRequestsApi";

const SmsReplyDialog = () => {
  const [open, setOpen] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [message, setMessage] = useState("");
  const [sendSms, { isLoading }] = useSendBloodRequestSmsMutation();

  const handleSend = async () => {
    if (!requestId.trim()) {
      toast.error("Request ID is required");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required");
      return;
    }

    try {
      await sendSms({ id: requestId.trim(), message: message.trim() }).unwrap();
      toast.success("SMS sent to requester");
      setRequestId("");
      setMessage("");
      setOpen(false);
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err, "Failed to send SMS"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="primary"
          className="h-11 rounded-xl font-black text-[10px] uppercase  border-border/40"
        >
          Send SMS Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-8 border-border/40 shadow-premium">
        <DialogHeader className="space-y-4 mb-8">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Mail className="size-7" />
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-black text-foreground tracking-tighter uppercase">
              Response Via SMS
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60  leading-relaxed">
              Send a status update to the requester&apos;s phone for a blood
              request.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label
              htmlFor="request-id"
              className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1"
            >
              Request Id
            </Label>
            <Input
              id="request-id"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
              placeholder="UUID from request list"
              className="h-14 rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-900 border-dashed focus:border-primary transition-all font-bold"
            />
          </div>
          <div className="space-y-3">
            <Label
              htmlFor="sms-message"
              className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1"
            >
              Transmission Data
            </Label>
            <Textarea
              id="sms-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your request is being processed. We will contact you shortly."
              className="min-h-32 rounded-2xl border-border/40 bg-zinc-50 dark:bg-zinc-900 border-dashed focus:border-primary transition-all p-4 font-medium "
            />
          </div>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-4 mt-4">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="h-14 rounded-2xl font-black text-xs uppercase  border-border/40"
            >
              Abort
            </Button>
          </DialogClose>
          <Button
            className="h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 border-none transition-all"
            onClick={handleSend}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Execute Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SmsReplyDialog;
