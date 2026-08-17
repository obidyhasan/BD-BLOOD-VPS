"use client";

import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { format } from "date-fns";
import AvatarUpload from "@/components/ui/avatar-upload";
import { Switch } from "@/components/ui/switch";
import { useUpdateMyProfileMutation } from "@/redux/features/donors/donorsApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetBloodGroupsQuery } from "@/redux/features/blood/bloodApi";
import {
  useGetDivisionsQuery,
  useGetDistrictsQuery,
  useGetUpazilasQuery,
} from "@/redux/features/location/locationApi";
import { PhoneVerificationSection } from "./PhoneVerificationSection";
import { useAppDispatch } from "@/redux/hooks";
import { updateUser } from "@/redux/features/auth/authSlice";
import type { FileWithPreview } from "@/hooks/use-file-upload";
import { resolveProfilePhoto } from "@/lib/profilePhoto";

const editProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid Bangladesh mobile number"),
  bloodGroupId: z.string().min(1, "Blood group is required"),
  divisionId: z.string().min(1, "Division is required"),
  districtId: z.string().min(1, "District is required"),
  upazilaId: z.string().min(1, "Upazila is required"),
  bio: z.string().min(10, "Tell the community a little about your donor journey"),
  available: z.boolean(),
});

type EditProfileValues = z.infer<typeof editProfileSchema>;

const emptyValues: EditProfileValues = {
  name: "",
  email: "",
  phone: "",
  bloodGroupId: "",
  divisionId: "",
  districtId: "",
  upazilaId: "",
  bio: "",
  available: true,
};

const EditProfileForm = ({ dialogOpen = true }: { dialogOpen?: boolean }) => {
  const dispatch = useAppDispatch();
  const { data: meData, isLoading: meLoading } = useGetMeQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation();
  const { data: bloodGroupsData, isLoading: bloodGroupsLoading } =
    useGetBloodGroupsQuery();
  const [avatarFile, setAvatarFile] = useState<FileWithPreview | null>(null);
  const [formReady, setFormReady] = useState(false);

  const me = meData?.data;
  const bloodGroups = bloodGroupsData?.data ?? [];

  const formValues = useMemo<EditProfileValues>(() => {
    if (!me) return emptyValues;

    return {
      name: me.fullName,
      email: me.email,
      phone: me.phone ?? "",
      bloodGroupId: String(me.bloodGroupId ?? ""),
      divisionId: String(me.divisionId ?? ""),
      districtId: String(me.districtId ?? ""),
      upazilaId: String(me.upazilaId ?? ""),
      bio: me.bio ?? "",
      available: me.availabilityStatus === "AVAILABLE",
    };
  }, [me]);

  const form = useForm<EditProfileValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: emptyValues,
  });

  const { data: divisionsData, isLoading: divisionsLoading } =
    useGetDivisionsQuery();

  const divisionId = form.watch("divisionId");
  const districtId = form.watch("districtId");

  const activeDivisionId = divisionId || me?.divisionId || "";
  const activeDistrictId = districtId || me?.districtId || "";

  const { data: districtsData, isLoading: districtsLoading } =
    useGetDistrictsQuery(
      activeDivisionId ? { divisionId: String(activeDivisionId) } : undefined,
      { skip: !activeDivisionId },
    );
  const { data: upazilasData, isLoading: upazilasLoading } =
    useGetUpazilasQuery(
      activeDistrictId ? { districtId: String(activeDistrictId) } : undefined,
      { skip: !activeDistrictId },
    );

  const referenceDataReady =
    Boolean(me) &&
    !bloodGroupsLoading &&
    !divisionsLoading &&
    bloodGroups.length > 0 &&
    (divisionsData?.data?.length ?? 0) > 0 &&
    (!me?.divisionId || !districtsLoading) &&
    (!me?.districtId || !upazilasLoading);

  useEffect(() => {
    if (!dialogOpen) {
      setFormReady(false);
      return;
    }

    if (!referenceDataReady) return;

    form.reset(formValues);
    setAvatarFile(null);
    setFormReady(true);
  }, [dialogOpen, referenceDataReady, formValues, form]);

  const profilePhotoSrc = resolveProfilePhoto(me?.profilePhoto);

  const onSubmit = async (data: EditProfileValues) => {
    try {
      const formData = new FormData();
      formData.append("fullName", data.name);
      formData.append("phone", data.phone.replace(/\s/g, ""));
      formData.append("bloodGroupId", data.bloodGroupId);
      formData.append("divisionId", data.divisionId);
      formData.append("districtId", data.districtId);
      formData.append("upazilaId", data.upazilaId);
      formData.append("bio", data.bio);
      formData.append(
        "availabilityStatus",
        data.available ? "AVAILABLE" : "UNAVAILABLE",
      );

      if (avatarFile?.file instanceof File) {
        formData.append("file", avatarFile.file);
      }

      const result = await updateProfile(formData).unwrap();
      dispatch(updateUser(result.data));
      setAvatarFile(null);
      toast.success("Profile updated successfully!");

      setTimeout(() => {
        const event = new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        });
        document.dispatchEvent(event);
      }, 100);
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const isLoading = meLoading || !referenceDataReady || !formReady || !me;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const joinedLabel = me.createdAt
    ? format(new Date(me.createdAt), "MMM dd yyyy")
    : "—";

  return (
    <Form {...form} key={`edit-profile-${me.id}-${formReady}`}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 border border-border/40 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

          <div className="relative">
            <AvatarUpload
              key={me.profilePhoto ?? "default-avatar"}
              defaultAvatar={profilePhotoSrc ?? undefined}
              onFileChange={(file) => setAvatarFile(file)}
            />
            <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-white dark:bg-zinc-800 border border-border/40 flex items-center justify-center shadow-lg">
              <Camera className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            <div className="space-y-1">
              <h4 className="text-xl font-black uppercase tracking-tighter leading-none">
                Profile Information
              </h4>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                Manage your digital presence and donation availability.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
                <span className="text-[9px] font-black uppercase  text-muted-foreground bg-primary/10 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-border/40">
                  Joined: {joinedLabel}
                </span>
              </div>
            </div>
          </div>

          <FormField
            control={form.control}
            name="available"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center gap-2 px-4 py-4 rounded-3xl bg-white dark:bg-zinc-950 border border-border/20 relative z-10">
                <FormLabel className="text-xs font-black uppercase  text-muted-foreground leading-none text-center">
                  Donation <br />
                  Status
                </FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-500 scale-90"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Full Name"
                    className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-bold"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-bold opacity-70"
                    readOnly
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                Donor Biography
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Share a short note about your donor journey"
                  className="min-h-28 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-medium"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                Phone Number
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  autoComplete="tel"
                  className="h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-bold"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <PhoneVerificationSection
                phone={field.value}
                verifiedPhone={me.phone}
                phoneVerifiedAt={me.phoneVerifiedAt}
              />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bloodGroupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  Blood Group
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 focus:ring-primary/20 font-bold px-6">
                      <SelectValue placeholder="Select Blood Group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2">
                    {bloodGroups.map((group) => (
                      <SelectItem
                        key={group.id}
                        value={group.id}
                        className="font-bold text-xs uppercase"
                      >
                        {group.groupName}
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
            name="divisionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  Division
                </FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("districtId", "");
                    form.setValue("upazilaId", "");
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold px-6">
                      <SelectValue placeholder="Division" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2 max-h-60">
                    {(divisionsData?.data ?? []).map((d) => (
                      <SelectItem
                        key={d.id}
                        value={d.id}
                        className="font-bold text-xs"
                      >
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="districtId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  District
                </FormLabel>
                <Select
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("upazilaId", "");
                  }}
                  value={field.value}
                  disabled={!divisionId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold px-6">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2 max-h-60">
                    {(districtsData?.data ?? []).map((d) => (
                      <SelectItem
                        key={d.id}
                        value={d.id}
                        className="font-bold text-xs"
                      >
                        {d.name}
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
            name="upazilaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-black uppercase text-muted-foreground px-1">
                  Upazila
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!districtId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full py-7 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-border/40 font-bold px-6">
                      <SelectValue placeholder="Upazila" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="rounded-2xl border-border/40 p-2 max-h-60">
                    {(upazilasData?.data ?? []).map((u) => (
                      <SelectItem
                        key={u.id}
                        value={u.id}
                        className="font-bold text-xs"
                      >
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6 border-t border-border/10 pt-6">
          <Button
            type="button"
            variant="outline"
            className="h-12 rounded-2xl font-black text-xs uppercase  border-border/40"
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "Escape",
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
            className="h-12 rounded-2xl font-black text-xs uppercase  bg-primary hover:bg-emerald-600 text-white"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditProfileForm;
