"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { contactSchema } from "@/zod/Contact/ContactSchema";
import { toast } from "sonner";
import { useSubmitContactMessageMutation } from "@/redux/features/contact/contactApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";

const ContactForm = () => {
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [submitContact, { isLoading }] = useSubmitContactMessageMutation();

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    try {
      await submitContact(data).unwrap();
      setIsSuccessModalOpen(true);
      form.reset();
      toast.success("Message sent successfully");
    } catch {
      toast.error("Could not send message. Please try again.");
    }
  };

  return (
    <div className="w-full flex">
      <Card className="w-full relative isolate shadow-none lg:ms-auto rounded-none bg-card p-1 rounded-xl border border-border/50 py-10">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl font-black text-foreground tracking-tight leading-[0.95] uppercase">Contact Us</CardTitle>
          <CardDescription className="text-muted-foreground text-lg font-medium leading-relaxed max-w-2xl border-l-2 border-primary/20 pl-3 ">
            {`We'd love to hear from you. Please fill out this form.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2">
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Name */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full Name"
                            className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Email"
                            className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Message */}
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={8}
                            placeholder="Write your message..."
                            className="w-full mt-2 py-6 bg-zinc-50 dark:bg-zinc-950 border border-primary/5 rounded-2xl px-5 text-sm font-bold 
      focus:ring-4 focus:ring-primary/10 hover:border-primary/20 transition-all"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button disabled={isLoading} className=" w-full h-16 px-10 text-xs rounded-2xl bg-primary hover:bg-emerald-600 shadow-2xl shadow-primary/30 transition-all duration-300 font-black uppercase  text-white group" type="submit">
                {isLoading ? "Sending..." : "Submit Message"}
                <Send className="ml-3 size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Success Modal */}
      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="rounded-[3rem] border-border/40 p-10 sm:max-w-md text-center">
          <div className="mx-auto size-24 rounded-[2rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
            <CheckCircle2 className="size-12 animate-in zoom-in duration-500" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter uppercase  text-center">Inquiry Transmitted</DialogTitle>
            <DialogDescription className="text-center text-sm font-medium  opacity-60">
              Your message has been securely vectorized into our administrative hub. Expected response latency: <span className="text-primary font-bold">2-4 Clinical Hours</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 my-6 rounded-[2rem] bg-zinc-50 border border-border/40 flex items-center gap-4 text-left">
            <div className="size-10 rounded-xl bg-white flex items-center justify-center border border-border/10">
              <ShieldCheck className="size-5 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase  opacity-60">
              Secure Transmission <br /> Protocol Active
            </p>
          </div>

          <DialogFooter className="sm:justify-center">
            <DialogClose asChild>
              <Button className="h-12 w-full rounded-2xl font-black uppercase  text-xs shadow-xl shadow-primary/20 bg-primary hover:bg-emerald-600">
                Acknowledged
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactForm;
