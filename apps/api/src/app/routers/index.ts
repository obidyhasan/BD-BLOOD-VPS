import { Router } from "express";
import { LocationRoutes } from "../modules/location/location.routes";
import { UserRouter } from "../modules/user/user.routes";
import { BloodRoutes } from "../modules/blood/blood.routes";
import { BloodDonationRoutes } from "../modules/bloodDonation/bloodDonation.routes";
import { BloodRequestRoutes } from "../modules/bloodRequest/bloodRequest.routes";
import { OrganizationRoutes } from "../modules/organization/organization.routes";
import { OrganizationPositionRoutes } from "../modules/organizationPosition/organizationPosition.routes";
import { OrganizationMemberRoutes } from "../modules/organizationMember/organizationMember.routes";
import { OrganizationBloodInventoryRoutes } from "../modules/organizationBloodInventory/organizationBloodInventory.routes";
import { PostRoutes } from "../modules/post/post.routes";
import { EventRoutes } from "../modules/event/event.routes";
import { MedicalInstitutionRoutes } from "../modules/medicalInstitution/medicalInstitution.routes";
import { DoctorRoutes } from "../modules/doctor/doctor.routes";
import { MedicalInformationRoutes } from "../modules/medicalInformation/medicalInformation.routes";
import { MedicalAdvertisementRoutes } from "../modules/medicalAdvertisement/medicalAdvertisement.routes";
import { BlogRoutes } from "../modules/blog/blog.routes";
import { GalleryRoutes } from "../modules/gallery/gallery.routes";
import { FaqRoutes } from "../modules/faq/faq.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { ReportRoutes } from "../modules/report/report.routes";
import { BloodRequestNotificationRoutes } from "../modules/bloodRequestNotification/bloodRequestNotification.routes";
import { AnalyticsRoutes } from "../modules/analytics/analytics.routes";
import { PolicyRoutes } from "../modules/policy/policy.routes";
import { AuthRouter } from "../modules/auth/auth.routes";
import { HealthRoutes } from "../modules/health/health.routes";
import { ContactRoutes } from "../modules/contact/contact.routes";
import { AchievementRoutes } from "../modules/achievement/achievement.routes";

const router = Router();
const moduleRouters = [
  {
    path: "/health",
    route: HealthRoutes,
  },
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/user",
    route: UserRouter,
  },
  {
    path: "/location",
    route: LocationRoutes,
  },
  {
    path: "/blood",
    route: BloodRoutes,
  },
  {
    path: "/blood-donations",
    route: BloodDonationRoutes,
  },
  {
    path: "/blood-requests",
    route: BloodRequestRoutes,
  },
  {
    path: "/organizations",
    route: OrganizationRoutes,
  },
  {
    path: "/organization-positions",
    route: OrganizationPositionRoutes,
  },
  {
    path: "/organization-members",
    route: OrganizationMemberRoutes,
  },
  {
    path: "/organization-inventory",
    route: OrganizationBloodInventoryRoutes,
  },
  {
    path: "/posts",
    route: PostRoutes,
  },
  {
    path: "/events",
    route: EventRoutes,
  },
  {
    path: "/medical-institutions",
    route: MedicalInstitutionRoutes,
  },
  {
    path: "/doctors",
    route: DoctorRoutes,
  },
  {
    path: "/medical-informations",
    route: MedicalInformationRoutes,
  },
  {
    path: "/medical-advertisements",
    route: MedicalAdvertisementRoutes,
  },
  {
    path: "/blogs",
    route: BlogRoutes,
  },
  {
    path: "/galleries",
    route: GalleryRoutes,
  },
  {
    path: "/faqs",
    route: FaqRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/reports",
    route: ReportRoutes,
  },
  {
    path: "/blood-request-notifications",
    route: BloodRequestNotificationRoutes,
  },
  // New
  {
    path: "/analytics",
    route: AnalyticsRoutes,
  },
  {
    path: "/policies",
    route: PolicyRoutes,
  },
  {
    path: "/contact",
    route: ContactRoutes,
  },
  {
    path: "/achievements",
    route: AchievementRoutes,
  },
];

moduleRouters.forEach((route) => router.use(route.path, route.route));
export default router;
