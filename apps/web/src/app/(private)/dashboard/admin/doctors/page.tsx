"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";
import {
  type Doctor,
  useCreateDoctorMutation,
  useDeleteDoctorMutation,
  useGetAllDoctorsQuery,
  useGetAllInstitutionsQuery,
  useUpdateDoctorMutation,
} from "@/redux/features/medicalInstitutions/medicalInstitutionsApi";
import { toast } from "sonner";

const emptyForm = { institutionId: "", name: "", specialization: "", phone: "", visitingHours: "", experience: "" };

export default function DoctorsAdminPage() {
  const { data: doctorsData, isLoading } = useGetAllDoctorsQuery({ limit: 200 });
  const { data: institutionsData } = useGetAllInstitutionsQuery({ limit: 200 });
  const [createDoctor, createState] = useCreateDoctorMutation();
  const [updateDoctor, updateState] = useUpdateDoctorMutation();
  const [deleteDoctor] = useDeleteDoctorMutation();
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const reset = () => { setEditing(null); setForm(emptyForm); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (editing) await updateDoctor({ id: editing.id, data: form }).unwrap();
      else await createDoctor(form).unwrap();
      toast.success(editing ? "Doctor updated" : "Doctor created");
      reset();
    } catch { toast.error("Could not save doctor"); }
  };

  return (
    <div className="space-y-8">
      <DashboardHeader title="Doctors" subtitle="Manage doctors and their institution relationships." badge="Medical" />
      <Card className="p-6">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2"><Label>Institution</Label><Select value={form.institutionId} onValueChange={(institutionId) => setForm({ ...form, institutionId })}><SelectTrigger><SelectValue placeholder="Select institution" /></SelectTrigger><SelectContent>{(institutionsData?.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
          {(["name", "specialization", "phone", "visitingHours", "experience"] as const).map((field) => <div className="space-y-2" key={field}><Label className="capitalize">{field.replace(/([A-Z])/g, " $1")}</Label><Input required={["name", "specialization", "phone"].includes(field)} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></div>)}
          <div className="flex items-end gap-2"><Button disabled={createState.isLoading || updateState.isLoading || !form.institutionId}>{editing ? "Update" : "Create"}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}</div>
        </form>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(doctorsData?.data ?? []).map((doctor) => <Card key={doctor.id} className="p-5"><h3 className="font-black">{doctor.name}</h3><p className="text-sm text-muted-foreground">{doctor.specialization} · {doctor.institution?.name}</p><p className="mt-2 text-sm">{doctor.phone}</p><div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditing(doctor); setForm({ institutionId: doctor.institutionId, name: doctor.name, specialization: doctor.specialization, phone: doctor.phone, visitingHours: doctor.visitingHours ?? "", experience: doctor.experience ?? "" }); }}>Edit</Button><Button size="sm" variant="destructive" onClick={async () => { try { await deleteDoctor(doctor.id).unwrap(); toast.success("Doctor removed"); } catch { toast.error("Could not remove doctor"); } }}>Delete</Button></div></Card>)}
      </div>
      {!isLoading && !(doctorsData?.data ?? []).length && <p className="text-center text-muted-foreground">No doctors configured.</p>}
    </div>
  );
}
