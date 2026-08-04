"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/apiError";

import { donorRegisterSchema } from "@/zod/Register/DonorRegisterSchema";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { RegisterRequest } from "@/redux/features/auth/auth.types";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Password from "@/components/ui/password";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DonorForm = () => {
  const id = useId();
  const router = useRouter();

  const [isReference, setIsReference] = useState(false);

  const [register, { isLoading }] = useRegisterMutation();
  const { data: bloodGroupsData, isLoading: bloodGroupsLoading } =
    useGetBloodGroupsQuery();
  const bloodGroups = bloodGroupsData?.data ?? [];

  const form = useForm<z.infer<typeof donorRegisterSchema>>({
    resolver: zodResolver(donorRegisterSchema),

    defaultValues: {
      name: "",
      email: "",
      number: "",
      // bloodGroup: "",
      password: "",
      reference: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof donorRegisterSchema>) => {
    try {
      const registerData: RegisterRequest = {
        fullName: data.name,
        email: data.email,
        password: data.password,
        phone: data.number,
        bloodGroupId: data.bloodGroup,
      };

      // Only include referenceEmail if it's provided and non-empty
      if (data.reference && data.reference.trim() !== "") {
        registerData.referenceEmail = data.reference.trim();
      }

      const response = await register(registerData).unwrap();

      const registeredEmail = registerData.email.trim().toLowerCase();
      toast.success(
        response.message ||
        "Registration successful. Enter the 6-digit code sent to your email.",
      );

      form.reset();

      router.push(`/verify-email?email=${encodeURIComponent(registeredEmail)}`);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(
        err,
        "Registration failed. Please try again.",
      );

      // If the error is about the reference email, show it inline on the field
      if (
        errorMessage.toLowerCase().includes("reference email") ||
        errorMessage.toLowerCase().includes("reference donor") ||
        errorMessage.toLowerCase().includes("referrer")
      ) {
        form.setError("reference", {
          type: "server",
          message: errorMessage,
        });
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        className="w-full space-y-6"
        onSubmit={form.handleSubmit(onSubmit, () => { })}
      >
        {/* NAME + EMAIL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NAME */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Full Name
                </FormLabel>

                <FormControl>
                  <Input
                    placeholder="Enter name"
                    className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* EMAIL */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Email
                </FormLabel>

                <FormControl>
                  <Input
                    type="email"
                    placeholder="bdblood@gmail.com"
                    className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* PHONE + BLOOD GROUP */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PHONE */}
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Phone Number
                </FormLabel>

                <FormControl>
                  <Input
                    placeholder="01XXXXXXXXX"
                    className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* BLOOD GROUP */}
          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                  Blood Group
                </FormLabel>

                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={bloodGroupsLoading || bloodGroups.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl border-border/40 bg-white dark:bg-zinc-900/50">
                      <SelectValue
                        placeholder={
                          bloodGroupsLoading
                            ? "Loading blood groups..."
                            : "Blood Group"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {bloodGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.groupName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* PASSWORD */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                Password
              </FormLabel>

              <FormControl>
                <Password
                  className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />

        {/* REFERENCE */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-border/40 space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id={id}
              className="rounded-lg size-5 h-5 w-5"
              checked={isReference}
              onCheckedChange={(checked) => {
                const isChecked = checked === true;

                setIsReference(isChecked);

                if (!isChecked) {
                  form.setValue("reference", "");
                }
              }}
            />

            <Label htmlFor={id} className="text-sm font-bold text-foreground">
              Do you have a reference?
            </Label>
          </div>

          {isReference && (
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem className="animate-in fade-in slide-in-from-top-2">
                  <FormLabel className="text-[10px] font-black uppercase  text-muted-foreground/60 ml-1">
                    Reference donor email
                  </FormLabel>

                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter reference donor email address"
                      className="h-14 rounded-2xl border-border/40 focus:border-primary transition-all bg-white dark:bg-zinc-900/50"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <Button
          type="submit"
          disabled={isLoading || bloodGroupsLoading || bloodGroups.length === 0}
          className="w-full h-14 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 shadow-xl shadow-primary/20 border-none transition-all hover:scale-[1.02] active:scale-95"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Create Profile"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DonorForm;
