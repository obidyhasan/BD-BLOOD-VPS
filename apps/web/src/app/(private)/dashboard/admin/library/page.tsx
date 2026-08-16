"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  type MedicalInfo,
  useCreateMedicalInfoMutation,
  useDeleteMedicalInfoMutation,
  useGetAdminMedicalInfosQuery,
  useGetAllInstitutionsQuery,
  useUpdateMedicalInfoMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { toast } from "sonner";

const emptyForm = { institutionId: "", title: "", content: "", category: "", status: "DRAFT" as const };

export default function LibraryAdminPage() {
  const { data: infoData, isLoading } = useGetAdminMedicalInfosQuery({ limit: 200 });
  const { data: institutionsData } = useGetAllInstitutionsQuery({ limit: 200 });
  const [createInfo, createState] = useCreateMedicalInfoMutation();
  const [updateInfo, updateState] = useUpdateMedicalInfoMutation();
  const [deleteInfo] = useDeleteMedicalInfoMutation();
  const [editing, setEditing] = useState<MedicalInfo | null>(null);
  const [form, setForm] = useState<{ institutionId: string; title: string; content: string; category: string; status: "DRAFT" | "PUBLISHED" }>(emptyForm);
  const reset = () => { setEditing(null); setForm(emptyForm); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await updateInfo({ id: editing.id, data: form }).unwrap();
      else await createInfo(form).unwrap();
      toast.success(editing ? "Library article updated" : "Library article created"); reset();
    } catch { toast.error("Could not save library article"); }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="Medical Library" subtitle="Create, edit and publish verified health information." badge="Medical" />
      <Card className="p-6"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label>Institution</Label><Select value={form.institutionId} onValueChange={(institutionId) => setForm({ ...form, institutionId })}><SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger><SelectContent>{(institutionsData?.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Title</Label><Input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
        <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
        <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(status: "DRAFT" | "PUBLISHED") => setForm({ ...form, status })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Published</SelectItem></SelectContent></Select></div>
        <div className="space-y-2 md:col-span-2"><Label>Content</Label><Textarea required rows={7} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></div>
        <div className="flex gap-2"><Button disabled={createState.isLoading || updateState.isLoading || !form.institutionId}>{editing ? "Update" : "Create"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}</div>
      </form></Card>
      <div className="space-y-3">{(infoData?.data ?? []).map((info) => <Card key={info.id} className="p-5"><div className="flex flex-col justify-between gap-4 md:flex-row"><div><p className="text-xs font-black uppercase text-primary">{info.status}</p><h3 className="font-black">{info.title}</h3><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{info.content}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(info); setForm({ institutionId: info.institutionId, title: info.title, content: info.content, category: info.category ?? "", status: info.status }); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { try { await deleteInfo(info.id).unwrap(); toast.success("Article removed"); } catch { toast.error("Could not remove article"); } }}>Delete</Button></div></div></Card>)}</div>
      {!isLoading && !(infoData?.data ?? []).length && <p className="text-center text-muted-foreground">No library articles configured.</p>}
    </div>
  );
}
