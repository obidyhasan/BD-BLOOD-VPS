import DonorPosts from "@/components/modules/Donor/Posts/DonorPosts";
import DashboardHeader from "@/components/shared/SectionHeader/DashboardHeader";

const DonorPostsPage = () => {
  return (
    <div className="space-y-8">
      <DashboardHeader
        variant="clinical"
        title="My Posts"
        subtitle="Manage your posts and see how donors are engaging with them."
        badge="Post Management"
      />
      <DonorPosts />
    </div>
  );
};

export default DonorPostsPage;
