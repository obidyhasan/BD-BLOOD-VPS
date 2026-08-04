import GalleryPage from "@/components/modules/Gallery/GalleryPage";
import { getAllGalleries } from "@/services/gallery";

export default async function Page() {
  const initialData = await getAllGalleries({ limit: 50, scope: "homepage" });
  return <GalleryPage initialData={initialData} />;
}
