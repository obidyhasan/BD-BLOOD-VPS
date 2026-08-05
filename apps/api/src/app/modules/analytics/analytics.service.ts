import { prisma } from "../../shared/prisma";
import {
  AccountStatus,
  AvailabilityStatus,
  BloodRequestStatus,
  ApprovalStatus,
  VerificationStatus,
  OrganizationMemberStatus,
  PositionLevel,
  Role,
} from "@prisma/client";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { IJWTPayload } from "../../types";
import { cacheHelper } from "../../helper/cacheHelper";

// Platform-wide counts are read far more often than they change meaningfully
// within a minute; caching removes 16 COUNT queries per request on two
// hot surfaces (admin dashboard + public homepage stats via getPublicStats)
// while staying fresh enough for an overview/stats context.
const PLATFORM_STATS_CACHE_TTL_SECONDS = 60;

const getPlatformStats = async () =>
  cacheHelper.getOrSetCache(
    "analytics:platformStats",
    PLATFORM_STATS_CACHE_TTL_SECONDS,
    async () => {
      const [
        totalDonors,
        verifiedDonors,
        availableDonors,
        totalOrganizations,
        verifiedOrganizations,
        totalBloodRequests,
        successfulRequests,
        fulfilledRequests,
        totalDonations,
        verifiedDonations,
        totalBlogs,
        totalPosts,
        featuredWorks,
        totalEvents,
        totalNotifications,
        unreadNotifications,
        pendingPosts,
        districtCount,
        upazilaCount,
      ] = await Promise.all([
        // Donors
        prisma.donor.count({ where: { isDeleted: false, accountStatus: AccountStatus.ACTIVE } }),
        prisma.donor.count({
          where: {
            isDeleted: false,
            accountStatus: AccountStatus.ACTIVE,
            isVerified: true,
          },
        }),
        prisma.donor.count({
          where: {
            isDeleted: false,
            accountStatus: AccountStatus.ACTIVE,
            availabilityStatus: AvailabilityStatus.AVAILABLE,
          },
        }),
        // Organizations
        prisma.organization.count({ where: { isDeleted: false } }),
        prisma.organization.count({
          where: { isDeleted: false, verificationStatus: VerificationStatus.VERIFIED },
        }),
        // Blood requests
        prisma.bloodRequest.count({ where: { isDeleted: false } }),
        prisma.bloodRequest.count({
          where: {
            isDeleted: false,
            status: {
              in: [BloodRequestStatus.FULFILLED, BloodRequestStatus.COMPLETED],
            },
          },
        }),
        prisma.bloodRequest.count({
          where: { isDeleted: false, status: BloodRequestStatus.FULFILLED },
        }),
        // Blood donations
        prisma.bloodDonation.count({ where: { isDeleted: false } }),
        prisma.bloodDonation.count({
          where: { isDeleted: false, verificationStatus: VerificationStatus.VERIFIED },
        }),
        // Blogs
        prisma.blog.count({ where: { isDeleted: false } }),
        // Posts
        prisma.post.count({ where: { isDeleted: false } }),
        prisma.post.count({ where: { isDeleted: false, isWork: true, approvalStatus: ApprovalStatus.APPROVED } }),
        // Events
        prisma.event.count({ where: { isDeleted: false } }),
        // Notifications
        prisma.notification.count({ where: { isDeleted: false } }),
        prisma.notification.count({ where: { isDeleted: false, isRead: false } }),
        prisma.post.count({
          where: { isDeleted: false, approvalStatus: ApprovalStatus.PENDING },
        }),
        prisma.district.count({ where: { isDeleted: false } }),
        prisma.upazila.count({ where: { isDeleted: false } }),
      ]);

      const fulfilmentRate =
        totalBloodRequests > 0
          ? Math.round((fulfilledRequests / totalBloodRequests) * 100)
          : 0;

      return {
        donors: {
          total: totalDonors,
          verified: verifiedDonors,
          available: availableDonors,
          unavailable: totalDonors - availableDonors,
        },
        organizations: {
          total: totalOrganizations,
          verified: verifiedOrganizations,
          pending: totalOrganizations - verifiedOrganizations,
        },
        bloodRequests: {
          total: totalBloodRequests,
          successful: successfulRequests,
          fulfilled: fulfilledRequests,
          pending: totalBloodRequests - fulfilledRequests,
          fulfilmentRate,
        },
        donations: {
          total: totalDonations,
          verified: verifiedDonations,
          pending: totalDonations - verifiedDonations,
        },
        content: {
          blogs: totalBlogs,
          posts: totalPosts,
          works: featuredWorks,
          events: totalEvents,
          pendingPosts,
        },
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
        },
        geo: {
          districts: districtCount,
          upazilas: upazilaCount,
        },
      };
    },
  );

export type ActivityFeedItem = {
  id: string;
  date: string;
  org: string;
  action: string;
  status: string;
  type: string;
  createdAt: string;
};

const formatActivityDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

const getActivityFeed = async (limit = 20, organizationId?: string): Promise<ActivityFeedItem[]> => {
  const take = Math.min(Math.max(limit, 1), 50);
  const events: ActivityFeedItem[] = [];

  const [requests, organizations, posts, donations, reports] = await Promise.all([
    prisma.bloodRequest.findMany({
      where: {
        isDeleted: false,
        // Filter to this org's relevant requests at the query level (not
        // after the `take` limit) so a genuinely recent request for this
        // org isn't silently dropped just because it falls outside the
        // platform-wide top 8.
        ...(organizationId
          ? {
              OR: [
                { organizationId },
                {
                  notifications: {
                    some: { organizationId, isDeleted: false },
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        bloodGroup: { select: { groupName: true } },
        district: { select: { name: true } },
        notifications: organizationId
          ? {
              where: { organizationId, isDeleted: false },
              take: 1,
              include: { organization: { select: { name: true } } },
            }
          : {
              where: { isDeleted: false },
              take: 1,
              include: { organization: { select: { name: true } } },
            },
      },
    }),
    organizationId
      ? []
      : prisma.organization.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, verificationStatus: true, createdAt: true },
        }),
    prisma.post.findMany({
      where: {
        isDeleted: false,
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        organization: { select: { name: true } },
        donor: { select: { fullName: true } },
      },
    }),
    prisma.bloodDonation.findMany({
      where: {
        isDeleted: false,
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        donor: { select: { fullName: true } },
        organization: { select: { name: true } },
      },
    }),
    organizationId
      ? []
      : prisma.report.findMany({
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 4,
        }),
  ]);

  for (const r of requests) {
    const orgName =
      r.notifications[0]?.organization?.name ?? r.district?.name ?? "Network";
    events.push({
      id: `req-${r.id}`,
      date: formatActivityDate(r.createdAt),
      org: orgName,
      action: `Blood request (${r.bloodGroup.groupName}, ${r.requiredUnits} units)`,
      status: r.status,
      type: r.requestType === "URGENT" ? "Security" : "Operation",
      createdAt: r.createdAt.toISOString(),
    });
  }

  for (const o of organizations) {
    events.push({
      id: `org-${o.id}`,
      date: formatActivityDate(o.createdAt),
      org: o.name,
      action:
        o.verificationStatus === "VERIFIED"
          ? "Organization verified on platform"
          : "New organization registered",
      status: o.verificationStatus === "VERIFIED" ? "Success" : "Processing",
      type: "Operation",
      createdAt: o.createdAt.toISOString(),
    });
  }

  for (const p of posts) {
    events.push({
      id: `post-${p.id}`,
      date: formatActivityDate(p.createdAt),
      org: p.organization?.name ?? p.donor.fullName,
      action: `Post submitted: ${p.title}`,
      status: p.approvalStatus,
      type: "Content",
      createdAt: p.createdAt.toISOString(),
    });
  }

  for (const d of donations) {
    events.push({
      id: `don-${d.id}`,
      date: formatActivityDate(d.createdAt),
      org: d.organization?.name ?? d.donor.fullName,
      action: "Blood donation recorded",
      status: d.verificationStatus,
      type: "Operation",
      createdAt: d.createdAt.toISOString(),
    });
  }

  for (const rep of reports) {
    events.push({
      id: `rep-${rep.id}`,
      date: formatActivityDate(rep.createdAt),
      org: "Moderation",
      action: `Report filed (${rep.targetType})`,
      status: rep.status,
      type: "Audit",
      createdAt: rep.createdAt.toISOString(),
    });
  }

  return events
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, take);
};

const getPublicStats = async () => {
  const platform = await getPlatformStats();
  return {
    donorsTotal: platform.donors.verified,
    donorsAvailable: platform.donors.available,
    fulfilledRequests: platform.bloodRequests.fulfilled,
    pendingRequests: platform.bloodRequests.pending,
    totalRequests: platform.bloodRequests.total,
    verifiedOrganizations: platform.organizations.verified,
    worksCount: platform.bloodRequests.successful,
    donationsTotal: platform.donations.total,
    districtsCovered: platform.geo.districts,
    upazilasCovered: platform.geo.upazilas,
    fulfilmentRate: platform.bloodRequests.fulfilmentRate,
  };
};

const BLOOD_GROUP_STATS_CACHE_TTL_SECONDS = 60;

const getBloodGroupStats = async () =>
  cacheHelper.getOrSetCache(
    "analytics:bloodGroupStats",
    BLOOD_GROUP_STATS_CACHE_TTL_SECONDS,
    async () => {
      const [bloodGroups, totalCounts, availableCounts] = await Promise.all([
        prisma.bloodGroup.findMany({
          where: { isDeleted: false },
          select: { id: true, groupName: true },
        }),
        prisma.donor.groupBy({
          by: ["bloodGroupId"],
          where: { isDeleted: false, accountStatus: AccountStatus.ACTIVE },
          _count: { _all: true },
        }),
        prisma.donor.groupBy({
          by: ["bloodGroupId"],
          where: {
            isDeleted: false,
            accountStatus: AccountStatus.ACTIVE,
            availabilityStatus: AvailabilityStatus.AVAILABLE,
          },
          _count: { _all: true },
        }),
      ]);

      const totalByGroup = new Map(
        totalCounts.map((row) => [row.bloodGroupId, row._count._all]),
      );
      const availableByGroup = new Map(
        availableCounts.map((row) => [row.bloodGroupId, row._count._all]),
      );

      return bloodGroups.map((group) => ({
        label: group.groupName,
        count: totalByGroup.get(group.id) ?? 0,
        available: availableByGroup.get(group.id) ?? 0,
      }));
    },
  );

const getDonorGrowthStats = async () => {
  // Last 6 months monthly donor registration count
  const months = 6;
  const now = new Date();

  const ranges = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx;
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    return { start, end };
  });

  // 6 independent count() calls — run them concurrently instead of one
  // sequential DB round trip per month.
  const counts = await Promise.all(
    ranges.map(({ start, end }) =>
      prisma.donor.count({
        where: {
          isDeleted: false,
          createdAt: { gte: start, lte: end },
        },
      }),
    ),
  );

  return ranges.map(({ start }, idx) => ({
    month: start.toLocaleString("en-US", { month: "short", year: "numeric" }),
    donors: counts[idx],
  }));
};

const getOrganizationStats = async (
  user: IJWTPayload,
  organizationIdFromQuery?: string,
) => {
  let organizationId: string;

  if (user.role === "ADMIN" && organizationIdFromQuery) {
    organizationId = organizationIdFromQuery;
  } else {
    const donor = await prisma.donor.findUnique({ where: { email: user.email } });
    if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");

    const membership = await prisma.organizationMember.findFirst({
      where: {
        donorId: donor.id,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
      },
      include: { position: { select: { level: true } } },
    });

    if (!membership?.organizationId) {
      throw new ApiError(httpStatus.FORBIDDEN, "No active organization membership");
    }

    if (
      membership.position.level !== PositionLevel.EXECUTIVE &&
      membership.position.level !== PositionLevel.MANAGEMENT
    ) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Insufficient organization permissions",
      );
    }

    organizationId = membership.organizationId;
  }

  const memberDonorIds = (
    await prisma.organizationMember.findMany({
      where: { organizationId, isDeleted: false, status: OrganizationMemberStatus.ACTIVE },
      select: { donorId: true },
    })
  ).map((m) => m.donorId);

  // `members` count is the same predicate as memberDonorIds above — reuse
  // its length instead of issuing a second, identical COUNT query.
  const [inventoryUnits, pendingRequests, pendingPosts] = await Promise.all([
    prisma.organizationBloodInventory.aggregate({
      where: { organizationId, isDeleted: false },
      _sum: { availableUnits: true },
    }),
    prisma.bloodRequestNotification.count({
      where: {
        organizationId,
        isDeleted: false,
        request: { isDeleted: false, status: BloodRequestStatus.PENDING },
      },
    }),
    prisma.post.count({
      where: {
        isDeleted: false,
        approvalStatus: ApprovalStatus.PENDING,
        OR: [
          { organizationId },
          ...(memberDonorIds.length ? [{ donorId: { in: memberDonorIds } }] : []),
        ],
      },
    }),
  ]);

  return {
    organizationId,
    members: memberDonorIds.length,
    inventoryUnits: inventoryUnits._sum.availableUnits ?? 0,
    pendingRequests,
    pendingPosts,
  };
};

const LOW_STOCK_THRESHOLD = 3;

const getOrganizationShortages = async () => {
  const inventory = await prisma.organizationBloodInventory.findMany({
    where: { isDeleted: false },
    include: {
      bloodGroup: true,
      organization: true,
    },
  });

  const districtIds = [
    ...new Set(
      inventory
        .map((row) => row.organization?.districtId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const divisionIds = [
    ...new Set(
      inventory
        .map((row) => row.organization?.divisionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [districts, divisions] = await Promise.all([
    districtIds.length
      ? prisma.district.findMany({
          where: { id: { in: districtIds }, isDeleted: false },
          select: { id: true, name: true },
        })
      : [],
    divisionIds.length
      ? prisma.division.findMany({
          where: { id: { in: divisionIds }, isDeleted: false },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const districtNameById = new Map(districts.map((d) => [d.id, d.name]));
  const divisionNameById = new Map(divisions.map((d) => [d.id, d.name]));

  const byOrg = new Map<
    string,
    {
      id: string;
      name: string;
      location: string;
      lowGroups: string[];
      outGroups: string[];
    }
  >();

  for (const row of inventory) {
    const org = row.organization;
    if (!org || org.isDeleted) continue;

    const groupName = row.bloodGroup?.groupName;
    if (!groupName) continue;

    const locationParts = [
      districtNameById.get(org.districtId),
      divisionNameById.get(org.divisionId),
    ].filter(Boolean);
    const location = locationParts.length
      ? locationParts.join(", ")
      : org.address;

    if (!byOrg.has(org.id)) {
      byOrg.set(org.id, {
        id: org.id,
        name: org.name,
        location,
        lowGroups: [],
        outGroups: [],
      });
    }

    const entry = byOrg.get(org.id)!;
    if (row.availableUnits <= 0) {
      if (!entry.outGroups.includes(groupName)) {
        entry.outGroups.push(groupName);
      }
    } else if (row.availableUnits <= LOW_STOCK_THRESHOLD) {
      if (!entry.lowGroups.includes(groupName)) {
        entry.lowGroups.push(groupName);
      }
    }
  }

  return Array.from(byOrg.values())
    .filter((o) => o.lowGroups.length > 0 || o.outGroups.length > 0)
    .sort((a, b) => b.outGroups.length - a.outGroups.length);
};

export const AnalyticsService = {
  getPlatformStats,
  getBloodGroupStats,
  getDonorGrowthStats,
  getOrganizationStats,
  getOrganizationShortages,
  getActivityFeed,
  getPublicStats,
};
