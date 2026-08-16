"use client";

import { useState } from "react";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type AchievementInput,
  type MyAchievement,
  useCreateAchievementMutation,
  useDeleteAchievementMutation,
  useGetAdminAchievementsQuery,
  useUpdateAchievementMutation,
} from "@/redux/features/achievements/achievementsApi";
import { Award, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const blank: AchievementInput = {
  title: "",
  description: "",
  icon: "Award",
  thresholdType: "VERIFIED_DONATIONS",
  thresholdValue: 1,
  active: true,
};

export default function AdminAchievementsPage() {
  const { data, isLoading } = useGetAdminAchievementsQuery();
  const [createAchievement, { isLoading: creating }] = useCreateAchievementMutation();
  const [updateAchievement, { isLoading: updating }] = useUpdateAchievementMutation();
  const [deleteAchievement] = useDeleteAchievementMutation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AchievementInput>(blank);

  const edit = (achievement: MyAchievement) => {
    setEditingId(achievement.id);
    setForm({ title: achievement.title, description: achievement.description, icon: achievement.icon, thresholdType: achievement.thresholdType, thresholdValue: achievement.thresholdValue, active: achievement.active });
  };

  const submit = async () => {
    if (form.title.trim().length < 3 || form.description.trim().length < 3 || form.thresholdValue < 1) {
      toast.error("Provide a title, description, and positive threshold");
      return;
    }
    try {
      if (editingId) await updateAchievement({ id: editingId, data: form }).unwrap();
      else await createAchievement(form).unwrap();
      toast.success(editingId ? "Achievement updated" : "Achievement created");
      setEditingId(null);
      setForm(blank);
    } catch {
      toast.error("Unable to save achievement");
    }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader variant="clinical" title="Achievements" subtitle="Manage database-driven donation milestones." badge="Recognition" />
      <section className="grid gap-4 rounded-3xl border bg-card p-6 md:grid-cols-2 xl:grid-cols-6">
        <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Achievement title" className="xl:col-span-2" />
        <Input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="Icon name" />
        <Input type="number" min={1} value={form.thresholdValue} onChange={(event) => setForm({ ...form, thresholdValue: Number(event.target.value) })} />
        <select value={form.thresholdType} onChange={(event) => setForm({ ...form, thresholdType: event.target.value as AchievementInput["thresholdType"] })} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="VERIFIED_DONATIONS">Verified donations</option>
          <option value="TOTAL_DONATIONS">Total submissions</option>
        </select>
        <Button onClick={() => void submit()} disabled={creating || updating}><Plus className="mr-2 size-4" /> {editingId ? "Save" : "Create"}</Button>
        <Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Achievement description" className="md:col-span-2 xl:col-span-5" />
        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel edit</Button>}
      </section>
      {isLoading ? <p>Loading achievements…</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(data?.data ?? []).map((achievement) => (
            <article key={achievement.id} className="space-y-4 rounded-3xl border bg-card p-6">
              <div className="flex items-start justify-between gap-3"><Award className="size-7 text-primary" /><Badge variant={achievement.active ? "primary" : "outline"}>{achievement.active ? "Active" : "Inactive"}</Badge></div>
              <div><h2 className="text-lg font-black">{achievement.title}</h2><p className="text-sm text-muted-foreground">{achievement.description}</p></div>
              <p className="text-sm font-bold">Threshold: {achievement.thresholdValue} {achievement.thresholdType.replaceAll("_", " ").toLowerCase()}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => edit(achievement)}><Pencil className="mr-2 size-4" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => void updateAchievement({ id: achievement.id, data: { active: !achievement.active } })}>{achievement.active ? "Deactivate" : "Activate"}</Button>
                <Button size="sm" variant="destructive" onClick={async () => { try { await deleteAchievement(achievement.id).unwrap(); toast.success("Achievement deleted"); } catch { toast.error("Unable to delete achievement"); } }}><Trash2 className="mr-2 size-4" /> Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
