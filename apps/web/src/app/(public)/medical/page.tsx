import MedicalPage from "@/components/modules/Medical/MedicalPage";
import {
  getAllInstitutions,
  getAllDoctors,
  getAllMedicalInfos,
} from "@/services/medicalInstitution";

export default async function Page() {
  const [institutionsRes, doctorsRes, infosRes] = await Promise.all([
    getAllInstitutions({ limit: 100 }),
    getAllDoctors({ limit: 100 }),
    getAllMedicalInfos({ limit: 100 }),
  ]);

  return (
    <MedicalPage
      initialInstitutions={institutionsRes?.data ?? []}
      initialDoctors={doctorsRes?.data ?? []}
      initialMedicalInfos={infosRes?.data ?? []}
    />
  );
}
