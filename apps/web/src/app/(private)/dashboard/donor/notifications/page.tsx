"use client";

import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  Bell,
  Droplets,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Inbox,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/apiError";
import {
  useGetMyNotificationsQuery,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  type Notification,
} from "@/redux/features/notifications/notificationsApi";
import {
  useAcceptRequestAssignmentMutation,
  useGetRequestAssignmentQuery,
  useRejectRequestAssignmentMutation,
  useWithdrawRequestAssignmentMutation,
} from "@/redux/features/bloodRequests/bloodRequestsApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useCreateDonationMutation } from "@/redux/features/bloodDonations/bloodDonationsApi";
import { formatDistanceToNow } from "date-fns";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

const isAssignmentNotification = (n: Notification) =>
  n.relatedType === "REQUEST_ASSIGNMENT" && !!n.relatedId;

const isPendingAssignmentNotification = (n: Notification) =>
  isAssignmentNotification(n) && !n.isRead;

const addressText = (request?: {
  upazila?: { name: string };
  district?: { name: string };
  division?: { name: string };
}) => [request?.upazila?.name, request?.district?.name, request?.division?.name].filter(Boolean).join(", ");

const NotificationItem = ({
  n,
  i,
  onRead,
  onDelete,
  onAccept,
  onReject,
  onOpenAssignment,
  acceptBlockedReason,
  isSmall = false,
}: {
  n: Notification;
  i: number;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onAccept: (notification: Notification) => void;
  onReject: (notification: Notification) => void;
  onOpenAssignment: (assignmentId: string) => void;
  acceptBlockedReason?: string | null;
  isSmall?: boolean;
}) => {
  const assignment = isPendingAssignmentNotification(n);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: i * 0.05 }}
    >
      <Card
        onClick={() => !n.isRead && onRead(n.id)}
        className={cn(
          "rounded-[2.5rem] border-border/40 shadow-none overflow-hidden transition-all cursor-pointer group hover:border-primary/20",
          !n.isRead
            ? "bg-white dark:bg-zinc-950 border-primary/20"
            : "bg-zinc-50/50 dark:bg-zinc-900/50 opacity-80",
        )}
      >
        <CardContent className={cn("p-6", isSmall && "p-4")}>
          <div className="flex gap-4">
            <div
              className={cn(
                "rounded-2xl flex items-center justify-center shrink-0",
                isSmall ? "size-10" : "size-12",
                n.type === "BLOOD_REQUEST" || n.type === "BLOOD"
                  ? "bg-red-500/10 text-red-500"
                  : "bg-primary/10 text-primary",
              )}
            >
              {n.type === "BLOOD_REQUEST" || n.type === "BLOOD" ? (
                <Droplets className={isSmall ? "size-5" : "size-6"} />
              ) : (
                <Bell className={isSmall ? "size-5" : "size-6"} />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "rounded-full px-2 py-0 font-black text-[7px] uppercase tracking-tighter",
                        n.priority === "HIGH"
                          ? "bg-red-500 text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-muted-foreground",
                      )}
                    >
                      {n.priority === "HIGH" ? "Urgent" : "Info"}
                    </Badge>
                    <span className="text-[9px] font-bold text-muted-foreground opacity-50 uppercase">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3
                    className={cn(
                      "font-black tracking-tight leading-tight",
                      isSmall ? "text-sm" : "text-lg",
                      n.isRead && "text-muted-foreground opacity-60",
                    )}
                  >
                    {n.title}
                  </h3>
                </div>
                {!n.isRead && <div className="size-1.5 rounded-full bg-red-500 animate-pulse mt-1.5" />}
              </div>

              <p
                className={cn(
                  "font-medium leading-relaxed",
                  isSmall ? "text-[10px]" : "text-xs",
                  !n.isRead ? "text-foreground/80" : "text-muted-foreground",
                )}
              >
                {n.message}
              </p>

              {!isSmall && (
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {assignment && n.relatedId && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAssignment(n.relatedId as string);
                          }}
                          variant="outline"
                          className="h-8 px-4 rounded-xl border-border/40 font-black text-[8px] uppercase gap-2"
                        >
                          <Eye className="size-3" />
                          View Request
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAccept(n);
                          }}
                          disabled={Boolean(acceptBlockedReason)}
                          title={acceptBlockedReason ?? undefined}
                          className="h-8 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[8px] uppercase gap-2 border-none"
                        >
                          <CheckCircle2 className="size-3" />
                          Accept
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReject(n);
                          }}
                          variant="outline"
                          className="h-8 px-4 rounded-xl border-border/40 font-black text-[8px] uppercase hover:text-red-500 gap-2"
                        >
                          <XCircle className="size-3" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    {!n.isRead && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRead(n.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl text-primary hover:bg-primary/10"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n.id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function AssignmentDetailsDialog({
  assignmentId,
  onOpenChange,
  onAccept,
  onReject,
  acceptBlockedReason,
  onSubmitDonation,
  onWithdraw,
}: {
  assignmentId: string | null;
  onOpenChange: (open: boolean) => void;
  onAccept: (assignmentId: string) => void;
  onReject: (assignmentId: string) => void;
  acceptBlockedReason?: string | null;
  onSubmitDonation: (assignmentId: string) => void;
  onWithdraw: (assignmentId: string) => void;
}) {
  const { data, isFetching } = useGetRequestAssignmentQuery(assignmentId ?? "", {
    skip: !assignmentId,
  });
  const assignment = data?.data;
  const request = assignment?.request;

  return (
    <Dialog open={!!assignmentId} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] border-border/40 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight">Blood Request Details</DialogTitle>
          <DialogDescription>Review the request before accepting or rejecting this donor assignment.</DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="h-64 flex items-center justify-center gap-3 text-sm font-bold text-muted-foreground">
            <Loader2 className="size-5 animate-spin" /> Loading request...
          </div>
        ) : request ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Detail label="Patient" value={request.requesterName} />
            <Detail label="Phone" value={request.requesterPhone} />
            <Detail label="Blood Group" value={request.bloodGroup?.groupName} />
            <Detail label="Required Bags" value={String(request.requiredUnits)} />
            <Detail label="Hospital" value={request.hospitalName} />
            <Detail label="Required Date" value={new Date(request.createdAt).toLocaleDateString()} />
            <Detail label="Location" value={addressText(request) || "-"} wide />
            <Detail label="Patient Condition" value={request.message ?? "-"} wide />
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-sm font-bold text-muted-foreground">
            Assignment details unavailable.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="rounded-xl font-black" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {assignment?.status === "ACCEPTED" && assignmentId && (
            <>
              <Button
                variant="outline"
                className="rounded-xl font-black text-red-600"
                onClick={() => onWithdraw(assignmentId)}
              >
                Withdraw Commitment
              </Button>
              <Button className="rounded-xl font-black" onClick={() => onSubmitDonation(assignmentId)}>
                <CalendarDays className="size-4 mr-2" /> Submit Donation
              </Button>
            </>
          )}
          {assignment?.status === "NOTIFIED" && assignmentId && (
            <>
              <Button variant="outline" className="rounded-xl font-black text-red-600" onClick={() => onReject(assignmentId)}>
                Reject
              </Button>
              <Button
                className="rounded-xl font-black"
                disabled={Boolean(acceptBlockedReason)}
                title={acceptBlockedReason ?? undefined}
                onClick={() => onAccept(assignmentId)}
              >
                Accept
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border/40 p-4", wide && "md:col-span-2")}>
      <p className="text-[9px] font-black uppercase  text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-foreground/80">{value || "-"}</p>
    </div>
  );
}

export default function DonorNotificationsPage() {
  useNotificationSocket();
  const { data, isLoading, refetch: refetchNotifications } = useGetMyNotificationsQuery();
  const { data: meData } = useGetMeQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [acceptAssignment] = useAcceptRequestAssignmentMutation();
  const [rejectAssignment] = useRejectRequestAssignmentMutation();
  const [createDonation] = useCreateDonationMutation();
  const [withdrawAssignment] = useWithdrawRequestAssignmentMutation();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  const notifications = useMemo(() => data?.data ?? [], [data?.data]);
  const acceptBlockedReason = meData?.data?.capabilities?.canAcceptBloodRequests
    ? null
    : meData?.data?.profileStatus === "INCOMPLETE"
      ? "Complete your donor profile before accepting requests."
      : !meData?.data?.emailVerified
        ? "Verify your email before accepting requests."
        : meData?.data?.cooldown?.eligibleNow === false
          ? `You can donate again after ${meData.data.cooldown.nextEligibleDonationAt ? new Date(meData.data.cooldown.nextEligibleDonationAt).toLocaleDateString() : "your cooldown"}.`
          : "You are not currently eligible to accept blood requests.";

  const unread = useMemo(() => notifications.filter((n) => !n.isRead), [notifications]);
  const read = useMemo(() => notifications.filter((n) => n.isRead), [notifications]);

  const handleRead = async (id: string) => {
    try {
      await markRead({ id, isRead: true }).unwrap();
      toast.success("Notification marked as seen.");
    } catch {
      toast.error("Failed to mark notification.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      toast.info("Deleted successfully.");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  const handleAcceptAssignment = async (id: string, notificationId?: string) => {
    try {
      await acceptAssignment(id).unwrap();
      if (notificationId) await markRead({ id: notificationId, isRead: true }).unwrap();
      toast.success("Assignment accepted.");
      setAssignmentId(null);
    } catch (e: unknown) {
      const code = (e as { data?: { errorCode?: string } })?.data?.errorCode;
      if (
        code === "REQUEST_CAPACITY_REACHED" ||
        code === "ASSIGNMENT_NOT_ACTIONABLE" ||
        code === "REQUEST_CLOSED"
      ) {
        if (notificationId) {
          await markRead({ id: notificationId, isRead: true }).unwrap().catch(() => undefined);
        }
        await refetchNotifications();
        toast.info("Already arranged. This assignment is no longer actionable.");
        setAssignmentId(null);
        return;
      }
      toast.error(extractErrorMessage(e, "Failed to accept assignment"));
    }
  };

  const handleRejectAssignment = async (id: string, notificationId?: string) => {
    try {
      await rejectAssignment({ assignmentId: id }).unwrap();
      if (notificationId) await markRead({ id: notificationId, isRead: true }).unwrap();
      toast.info("Assignment rejected.");
      setAssignmentId(null);
    } catch (e: unknown) {
      toast.error(extractErrorMessage(e, "Failed to reject assignment"));
    }
  };

  const handleSubmitDonation = async (id: string) => {
    if (!meData?.data?.capabilities?.canSubmitDonation) {
      toast.error("Complete your donor profile before submitting a donation.");
      return;
    }
    try {
      await createDonation({
        requestAssignmentId: id,
        donationDate: new Date().toISOString(),
      }).unwrap();
      toast.success("Donation details submitted for organization verification.");
      setAssignmentId(null);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to submit donation"));
    }
  };

  const handleWithdrawAssignment = async (id: string) => {
    const reason = window.prompt("Why are you withdrawing this commitment?")?.trim();
    if (!reason || reason.length < 3) return;
    try {
      await withdrawAssignment({ assignmentId: id, reason }).unwrap();
      await refetchNotifications();
      toast.info("Commitment withdrawn. The organization can notify a replacement donor.");
      setAssignmentId(null);
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, "Failed to withdraw commitment"));
    }
  };

  return (
    <div className="space-y-10">
      <DashboardHeader
        variant="clinical"
        title="My Notifications"
        subtitle="View your latest alerts and blood requests here."
        badge="Inbox"
      />

      {isLoading ? (
        <div className="pt-20 flex flex-col items-center justify-center gap-4">
          <div className="size-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <p className="text-xs font-black uppercase  text-muted-foreground">Finding messages...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase  flex items-center gap-3">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                New Messages
              </h2>
              <Badge variant="outline" className="rounded-full border-border/40 font-black text-[9px] uppercase  px-3">
                {unread.length} New
              </Badge>
            </div>

            <div className="space-y-4">
              {unread.length === 0 ? (
                <Card className="rounded-[3rem] border-dashed border-border/60 bg-transparent shadow-none p-16 text-center">
                  <div className="size-20 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-6 opacity-30">
                    <Inbox className="size-10" />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight opacity-40">No New Notifications</h3>
                  <p className="text-xs font-medium text-muted-foreground mt-2">You have seen all your messages.</p>
                </Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  {unread.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      n={n}
                      i={i}
                      onRead={handleRead}
                      onDelete={handleDelete}
                      onAccept={(notification) => notification.relatedId && handleAcceptAssignment(notification.relatedId, notification.id)}
                      onReject={(notification) => notification.relatedId && handleRejectAssignment(notification.relatedId, notification.id)}
                      onOpenAssignment={setAssignmentId}
                      acceptBlockedReason={acceptBlockedReason}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black uppercase  flex items-center gap-3 text-muted-foreground">
                <Bell className="size-4 opacity-40" />
                Previous History
              </h2>
              <Badge variant="outline" className="rounded-full border-none bg-zinc-100 dark:bg-zinc-900 font-black text-[9px] uppercase  px-3">
                {read.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {read.length === 0 ? (
                <div className="h-[150px] flex items-center justify-center border border-dashed border-border/20 rounded-[2.5rem] opacity-30 text-xs font-medium">
                  No previous messages
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {read.map((n, i) => (
                    <NotificationItem
                      key={n.id}
                      n={n}
                      i={unread.length + i}
                      onRead={handleRead}
                      onDelete={handleDelete}
                      onAccept={(notification) => notification.relatedId && handleAcceptAssignment(notification.relatedId, notification.id)}
                      onReject={(notification) => notification.relatedId && handleRejectAssignment(notification.relatedId, notification.id)}
                      onOpenAssignment={setAssignmentId}
                      isSmall={true}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      )}

      <AssignmentDetailsDialog
        assignmentId={assignmentId}
        onOpenChange={(open) => !open && setAssignmentId(null)}
        onAccept={(id) => handleAcceptAssignment(id)}
        onReject={(id) => handleRejectAssignment(id)}
        acceptBlockedReason={acceptBlockedReason}
        onSubmitDonation={handleSubmitDonation}
        onWithdraw={handleWithdrawAssignment}
      />
    </div>
  );
}
