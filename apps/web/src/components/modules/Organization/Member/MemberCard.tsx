"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog/DeleteConfirmDialog";
import { useUpdateMemberStatusMutation } from "@/redux/features/organizations/organizationsApi";
import type { OrgMemberUIModel } from "@/lib/member";
import { toast } from "sonner";
import Link from "next/link";

type MemberCardProps = {
  member: OrgMemberUIModel;
  index?: number;
};

const MemberCard = ({ member, index = 0 }: MemberCardProps) => {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateStatus, { isLoading: deleting }] = useUpdateMemberStatusMutation();

  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleDelete = async () => {
    try {
      await updateStatus({ memberId: member.id, status: "REJECTED" }).unwrap();
      toast.success("Member removed from the organization");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to remove member");
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -6, scale: 1.01 }}
        className="relative h-full group"
      >
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="size-8 rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <Link href={`/donor/${member.slug}`} className="block h-full">
          <div className="p-6 rounded-[2.5rem] border border-border/40 bg-white dark:bg-zinc-900 transition-all duration-500 hover:shadow-premium hover:border-primary/30 relative overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -ml-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
              <div className="relative">
                <div className="size-24 rounded-3xl overflow-hidden border-2 border-background shadow-xl group-hover:rotate-3 transition-transform duration-500 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <span className="text-3xl font-black text-muted-foreground">{initials}</span>
                </div>
                <div className={`absolute -bottom-2 -right-2 size-10 rounded-xl flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl group-hover:scale-110 transition-all ${member.status === "active" ? "bg-emerald-500" : "bg-zinc-400"}`}>
                  {member.status === "active"
                    ? <CheckCircle className="size-5 text-white" />
                    : <XCircle className="size-5 text-white" />
                  }
                </div>
              </div>

              <div className="space-y-1 w-full">
                <h3 className="font-black text-xl text-foreground tracking-tighter group-hover:text-primary transition-colors">{member.name}</h3>
                <div className="flex flex-col items-center gap-2 mt-2">
                  <Badge className="rounded-full px-4 py-1.5 text-[10px] font-black uppercase  border-none bg-primary/10 text-primary">
                    {member.position}
                  </Badge>
                  <span className="text-[10px] font-black uppercase text-muted-foreground opacity-30 ">
                    #{member.employeeId}
                  </span>
                </div>
              </div>

              {member.email && (
                <div className="w-full space-y-2 text-center pt-2 border-t border-border/10">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground text-[11px] font-bold">
                    <Mail className="size-3 opacity-40 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Member"
        description={`Remove ${member.name} (${member.position}) from the organization? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

export default MemberCard;
