"use client";

import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import BroadcastModal from "@/components/modules/Admin/Notifications/BroadcastModal";
import NotificationCenterPage from "@/components/modules/Notification/NotificationCenterPage";
import {
  useGetMyNotificationsQuery,
  useMarkAllReadMutation,
} from "@/redux/features/notifications/notificationsApi";

export default function AdminNotificationsPage() {
  const { data, isLoading } = useGetMyNotificationsQuery();
  const [markAllRead] = useMarkAllReadMutation();

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const adminActions = (
    <>
      <Button
        variant="outline"
        className="h-14 px-8 rounded-2xl border-border/40 font-black text-[10px] uppercase  shadow-premium transition-all"
        onClick={handleMarkAllRead}
        disabled={unreadCount === 0 || isLoading}
      >
        <CheckCheck className="mr-2 size-4 opacity-40" /> Mark All Read
      </Button>
      <BroadcastModal />
    </>
  );

  return (
    <div>
      <NotificationCenterPage
        title="Admin Notifications"
        subtitle="Alerts, approvals, and important platform events."
        extraActions={adminActions}
        isAdmin={true}
      />
    </div>
  );
}