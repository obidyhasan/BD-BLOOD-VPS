"use client";

import { extractErrorMessage } from "@/lib/apiError";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { useBroadcastNotificationMutation } from "@/redux/features/notifications/notificationsApi";

const broadcastSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  message: z.string().min(10, "Message body must be at least 10 characters"),
  type: z.enum(["SYSTEM", "BLOOD", "EVENT", "ORG", "ADMIN"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW", "ROUTINE"]),
});

const BroadcastModal = () => {
  const [open, setOpen] = useState(false);
  const [broadcastNotification, { isLoading }] = useBroadcastNotificationMutation();

  const form = useForm<z.infer<typeof broadcastSchema>>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "SYSTEM",
      priority: "MEDIUM",
    },
  });

  const onSubmit = async (data: z.infer<typeof broadcastSchema>) => {
    try {
      const result = await broadcastNotification({
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority,
      }).unwrap();
      toast.success(
        result.message || "Sent to all active donors",
      );
      setOpen(false);
      form.reset();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, "Failed to send");
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 rounded-2xl bg-primary text-white font-black text-[10px] uppercase  hover:bg-emerald-600 shadow-xl shadow-primary/20 transition-all shrink-0">
          System Alert <Send className="ml-2 size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-border/40 p-8 sm:max-w-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
        <DialogHeader className="space-y-4">
          <div>
            <DialogTitle className="text-3xl font-black text-foreground tracking-tighter uppercase">
              System Alert
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-muted-foreground/60 mt-1">
              Send an important notification to verified users and
              organizations.
            </DialogDescription>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground  px-1">
                      Alert Type
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {[
                          { val: "SYSTEM", label: "System" },
                          { val: "BLOOD", label: "Emergency Blood" },
                          { val: "ORG", label: "Organization" },
                          { val: "EVENT", label: "Platform Event" },
                          { val: "ADMIN", label: "Admin Notice" },
                        ].map((cat) => (
                          <SelectItem
                            key={cat.val}
                            value={cat.val}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-black uppercase text-muted-foreground  px-1">
                      Priority Level
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="py-7 w-full rounded-2xl bg-zinc-50 border-border/40 font-bold">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-2xl p-2">
                        {[
                          { val: "HIGH", label: "🔴 High" },
                          { val: "MEDIUM", label: "🟡 Medium" },
                          { val: "LOW", label: "🟢 Low" },
                          { val: "ROUTINE", label: "⚪ Routine" },
                        ].map((p) => (
                          <SelectItem
                            key={p.val}
                            value={p.val}
                            className="rounded-xl font-bold text-xs uppercase my-1"
                          >
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Alert Headline
                  </FormLabel>
                  <FormControl>
                    <Input
                      className="h-14 rounded-2xl bg-zinc-50 border-border/40 font-bold"
                      placeholder="E.g., System Maintenance"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase text-muted-foreground  px-1">
                    Message Body
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      className="min-h-[120px] rounded-2xl bg-zinc-50 border-border/40 font-medium p-4 resize-none leading-relaxed"
                      placeholder="Detailed instructions or information..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="grid grid-cols-2 gap-4">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 text-white transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Dispatching...
                  </span>
                ) : (
                  "Send Alert"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default BroadcastModal;