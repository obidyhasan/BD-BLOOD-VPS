import httpStatus from "http-status";
import {
  AccountStatus,
  ApprovalStatus,
  OrganizationMemberStatus,
  PositionLevel,
  PostType,
  PostVisibility,
  Prisma,
  Role,
  VerificationStatus,
} from "@prisma/client";
import { prisma } from "../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { IGenericFilters } from "../../interfaces/common";
import { IJWTPayload } from "../../types";
import { postSearchableFields } from "./post.constant";
import { isUuid, toSlug } from "../../shared/slugHelper";

// Post types that represent a donor sharing their own donation story
// ("I donated blood"), as opposed to organization-authored broadcast types
// (URGENT/EMERGENCY/EVENT/ANNOUNCEMENT calls for donors, or GENERAL org
// updates). DONATION is the legacy value RECAP replaced (see enum.prisma);
// both are kept so old and new personal-donation posts are covered.
const PERSONAL_DONATION_POST_TYPES: PostType[] = [
  PostType.RECAP,
  PostType.DONATION,
];

const uniquePostSlug = async (title: string, excludeId?: string) => {
  let base = toSlug(title) || "post";
  let slug = base;
  let n = 1;
  while (
    await prisma.post.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
};

const HOMEPAGE_LIMIT_MAX = 12;

const homepagePostSelect = {
  id: true,
  donorId: true,
  organizationId: true,
  donationId: true,
  postType: true,
  visibility: true,
  isWork: true,
  title: true,
  content: true,
  images: true,
  approvalStatus: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  donor: {
    select: {
      id: true,
      slug: true,
      fullName: true,
      profilePhoto: true,
      bloodGroup: { select: { groupName: true } },
      affiliations: {
        where: {
          active: true,
          organization: {
            isDeleted: false,
            organizationStatus: "ACTIVE",
            verificationStatus: VerificationStatus.VERIFIED,
          },
        },
        take: 1,
        select: {
          organization: { select: { id: true, name: true } },
        },
      },
    },
  },
  organization: { select: { id: true, name: true } },
  _count: { select: { likes: true, comments: true } },
} satisfies Prisma.PostSelect;

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const getRandomPosts = async (
  where: Prisma.PostWhereInput,
  requestedLimit: number,
) => {
  const limit = Math.min(Math.max(requestedLimit, 1), HOMEPAGE_LIMIT_MAX);
  const total = await prisma.post.count({ where });
  if (total === 0) return [];

  const windowSize = Math.min(total, limit * 3);
  const maxSkip = Math.max(total - windowSize, 0);
  const skip = maxSkip > 0 ? Math.floor(Math.random() * (maxSkip + 1)) : 0;
  const posts = await prisma.post.findMany({
    where,
    skip,
    take: windowSize,
    orderBy: { createdAt: "desc" },
    select: homepagePostSelect,
  });

  return shuffle(posts)
    .slice(0, limit)
    .map(({ donor, organization, ...post }) => {
      const { affiliations, ...publicDonor } = donor;
      return {
        ...post,
        donor: publicDonor,
        organization: organization ?? affiliations[0]?.organization ?? null,
      };
    });
};

const toPublicPost = <
  T extends { donor: Record<string, unknown> },
>(post: T) => {
  const {
    email: _email,
    phone: _phone,
    password: _password,
    phoneVerifiedAt: _phoneVerifiedAt,
    ...publicDonor
  } = post.donor;
  return { ...post, donor: publicDonor };
};

const getRequesterDonor = async (user: IJWTPayload) => {
  const donor = await prisma.donor.findUnique({ where: { email: user.email } });
  if (!donor) throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  if (donor.isDeleted)
    throw new ApiError(httpStatus.BAD_REQUEST, "User is deleted!");
  if (donor.accountStatus !== AccountStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, `User is ${donor.accountStatus}`);
  }
  return donor;
};

const assertCanAssociateWithOrganization = async (
  user: IJWTPayload,
  donorId: string,
  organizationId?: string | null,
) => {
  if (!organizationId) return;

  const organization = await prisma.organization.findUnique({
    where: { id: organizationId, isDeleted: false },
    select: { id: true },
  });
  if (!organization) {
    throw new ApiError(httpStatus.NOT_FOUND, "Organization not found!");
  }
  if (user.role === Role.ADMIN) return;

  const [affiliation, membership] = await Promise.all([
    prisma.donorOrganizationAffiliation.findFirst({
      where: { donorId, organizationId, active: true },
      select: { id: true },
    }),
    prisma.organizationMember.findFirst({
      where: {
        donorId,
        organizationId,
        status: OrganizationMemberStatus.ACTIVE,
        isDeleted: false,
      },
      select: { id: true },
    }),
  ]);

  if (!affiliation && !membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You cannot associate a post with an organization outside your affiliation.",
    );
  }
};

const assertCanAuthorOrganizationPost = async (
  user: IJWTPayload,
  donorId: string,
  organizationId?: string | null,
) => {
  if (user.role === Role.ADMIN) return;
  if (!organizationId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Personal donor posts must be linked to an unused verified donation.",
    );
  }
  const membership = await prisma.organizationMember.findFirst({
    where: {
      donorId,
      organizationId,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
      position: {
        level: { in: [PositionLevel.EXECUTIVE, PositionLevel.MANAGEMENT] },
      },
    },
    select: { id: true },
  });
  if (!membership) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only organization managers can publish organization updates.",
    );
  }
};

const createPost = async (
  user: IJWTPayload,
  payload: any,
  imageUrls: string[] = [],
) => {
  const donor = await getRequesterDonor(user);
  await assertCanAssociateWithOrganization(
    user,
    donor.id,
    payload.organizationId,
  );

  let donationId: string | null = null;
  if (PERSONAL_DONATION_POST_TYPES.includes(payload.postType)) {
    if (!payload.donationId) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Select an unused verified donation before sharing a donation recap.",
        "",
        "DONATION_POST_GRANT_REQUIRED",
      );
    }
    const verifiedDonation = await prisma.bloodDonation.findFirst({
      where: {
        id: payload.donationId,
        donorId: donor.id,
        isDeleted: false,
        verificationStatus: VerificationStatus.VERIFIED,
        post: null,
      },
      select: { id: true },
    });
    if (!verifiedDonation) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This donation is not eligible for a new donation recap.",
        "",
        "DONATION_POST_GRANT_UNAVAILABLE",
      );
    }
    donationId = verifiedDonation.id;
  } else {
    await assertCanAuthorOrganizationPost(
      user,
      donor.id,
      payload.organizationId,
    );
  }

  const slug = await uniquePostSlug(payload.title);

  const result = await prisma.post.create({
    data: {
      donorId: donor.id,
      organizationId: payload.organizationId ?? null,
      donationId,
      postType: payload.postType,
      title: payload.title,
      slug,
      content: payload.content,
      visibility: payload.visibility ?? undefined,
      images: [...(payload.images ?? []), ...imageUrls],
      approvalStatus: ApprovalStatus.PENDING,
    },
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
    },
  });

  return result;
};

const getPostEligibility = async (user: IJWTPayload) => {
  const donor = await getRequesterDonor(user);
  return prisma.bloodDonation.findMany({
    where: {
      donorId: donor.id,
      isDeleted: false,
      verificationStatus: VerificationStatus.VERIFIED,
      post: null,
    },
    select: {
      id: true,
      donationDate: true,
      hospitalName: true,
      recipientName: true,
      organization: { select: { id: true, name: true } },
    },
    orderBy: { donationDate: "desc" },
  });
};

const getMyPosts = async (
  user: IJWTPayload,
  params: Record<string, unknown>,
  options: Record<string, unknown>,
) => {
  const donor = await getRequesterDonor(user);
  return getAllPosts({ ...params, donorId: donor.id }, options, false);
};

const BOOLEAN_FIELDS = ["isWork", "isDeleted"] as const;

const coerceFilterValue = (key: string, value: unknown): unknown => {
  if (BOOLEAN_FIELDS.includes(key as any)) {
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
  }
  return value;
};

const getHomepagePosts = async (successLimit = 6, donorLimit = 8) => {
  const publicBase: Prisma.PostWhereInput = {
    isDeleted: false,
    approvalStatus: ApprovalStatus.APPROVED,
    visibility: PostVisibility.PUBLIC,
    donor: {
      isDeleted: false,
      accountStatus: AccountStatus.ACTIVE,
    },
  };

  const [successHistory, donorPosts] = await Promise.all([
    getRandomPosts(
      {
        ...publicBase,
        OR: [
          { donor: { role: Role.ADMIN } },
          {
            organization: {
              isDeleted: false,
              organizationStatus: "ACTIVE",
              verificationStatus: VerificationStatus.VERIFIED,
            },
          },
        ],
      },
      successLimit,
    ),
    getRandomPosts(
      {
        ...publicBase,
        postType: { in: PERSONAL_DONATION_POST_TYPES },
        donor: {
          isDeleted: false,
          accountStatus: AccountStatus.ACTIVE,
          affiliations: {
            some: {
              active: true,
              organization: {
                isDeleted: false,
                organizationStatus: "ACTIVE",
                verificationStatus: VerificationStatus.VERIFIED,
              },
            },
          },
        },
      },
      donorLimit,
    ),
  ]);

  return { successHistory, donorPosts };
};

const getAllPosts = async (params: IGenericFilters, options: IOptions, onlyApproved = false) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.PostWhereInput[] = [{ isDeleted: false }];

  if (onlyApproved) {
    andConditions.push({
      approvalStatus: ApprovalStatus.APPROVED,
      visibility: PostVisibility.PUBLIC,
    });
  }

  if (searchTerm) {
    andConditions.push({
      OR: postSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: coerceFilterValue(key, filterData[key]) },
      })),
    });
  }

  const whereConditions: Prisma.PostWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy]: sortOrder },
      include: {
        donor: { omit: { password: true }, include: { bloodGroup: true } },
        organization: true,
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.post.count({ where: whereConditions }),
  ]);

  return {
    meta: { page, limit, total },
    data: onlyApproved ? result.map(toPublicPost) : result,
  };
};

const resolvePostId = async (slugOrId: string, onlyApproved: boolean) => {
  if (isUuid(slugOrId)) return slugOrId;

  const bySlug = await prisma.post.findFirst({
    where: {
      slug: slugOrId,
      isDeleted: false,
      ...(onlyApproved
        ? {
            approvalStatus: ApprovalStatus.APPROVED,
            visibility: PostVisibility.PUBLIC,
          }
        : {}),
    },
    select: { id: true },
  });
  if (bySlug) return bySlug.id;

  const posts = await prisma.post.findMany({
    where: {
      isDeleted: false,
      ...(onlyApproved
        ? {
            approvalStatus: ApprovalStatus.APPROVED,
            visibility: PostVisibility.PUBLIC,
          }
        : {}),
    },
    select: { id: true, title: true },
  });
  const match = posts.find((p) => toSlug(p.title) === slugOrId);
  if (!match) throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");
  return match.id;
};

const getPostBySlug = async (slug: string) => {
  const post = await prisma.post.findFirst({
    where: {
      slug,
      isDeleted: false,
      approvalStatus: ApprovalStatus.APPROVED,
      visibility: PostVisibility.PUBLIC,
    },
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");
  }

  return toPublicPost(post);
};

const getSinglePost = async (slugOrId: string, onlyApproved = false) => {
  const id = await resolvePostId(slugOrId, onlyApproved);

  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id,
      isDeleted: false,
      ...(onlyApproved
        ? {
            approvalStatus: ApprovalStatus.APPROVED,
            visibility: PostVisibility.PUBLIC,
          }
        : {}),
    },
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
      _count: { select: { likes: true, comments: true } },
    },
  });
  return onlyApproved ? toPublicPost(post) : post;
};

const getMyPostBySlug = async (user: IJWTPayload, slug: string) => {
  const donor = await getRequesterDonor(user);
  const post = await prisma.post.findFirst({
    where: {
      slug,
      donorId: donor.id,
      isDeleted: false,
    },
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");
  }

  return post;
};

const getPostComments = async (slugOrId: string, onlyApproved = true) => {
  const postId = await resolvePostId(slugOrId, onlyApproved);
  return prisma.postComment.findMany({
    where: { postId, isDeleted: false, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      donor: {
        select: { id: true, fullName: true, profilePhoto: true },
      },
      replies: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        include: {
          donor: {
            select: { id: true, fullName: true, profilePhoto: true },
          },
        },
      },
    },
  });
};

const createPostComment = async (
  user: IJWTPayload,
  slugOrId: string,
  content: string,
  parentId?: string | null,
  onlyApproved = true,
) => {
  const donor = await getRequesterDonor(user);
  const postId = await resolvePostId(slugOrId, onlyApproved);

  if (parentId) {
    const parent = await prisma.postComment.findFirst({
      where: {
        id: parentId,
        postId,
        isDeleted: false,
        parentId: null,
      },
    });
    if (!parent) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid reply target");
    }
  }

  return prisma.postComment.create({
    data: {
      postId,
      donorId: donor.id,
      content,
      parentId: parentId ?? null,
    },
    include: {
      donor: { select: { id: true, fullName: true, profilePhoto: true } },
      replies: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        include: {
          donor: {
            select: { id: true, fullName: true, profilePhoto: true },
          },
        },
      },
    },
  });
};

const togglePostLike = async (user: IJWTPayload, slugOrId: string) => {
  const donor = await getRequesterDonor(user);
  const postId = await resolvePostId(slugOrId, true);

  const existing = await prisma.postLike.findUnique({
    where: { postId_donorId: { postId, donorId: donor.id } },
  });

  if (existing) {
    await prisma.postLike.delete({ where: { id: existing.id } });
    const count = await prisma.postLike.count({ where: { postId } });
    return { liked: false, likeCount: count };
  }

  await prisma.postLike.create({ data: { postId, donorId: donor.id } });
  const count = await prisma.postLike.count({ where: { postId } });
  return { liked: true, likeCount: count };
};

const updatePost = async (
  user: IJWTPayload,
  id: string,
  payload: any,
  imageUrls: string[] = [],
) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.post.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");

  if (user.role !== "ADMIN" && existing.donorId !== donor.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to update this post!",
    );
  }

  if (payload.organizationId !== undefined) {
    await assertCanAssociateWithOrganization(
      user,
      donor.id,
      payload.organizationId,
    );
  }

  const targetPostType = payload.postType ?? existing.postType;
  if (!PERSONAL_DONATION_POST_TYPES.includes(targetPostType)) {
    await assertCanAuthorOrganizationPost(
      user,
      donor.id,
      payload.organizationId ?? existing.organizationId,
    );
  }

  const keptUrls = Array.isArray(payload.images)
    ? payload.images
    : payload.images
      ? [payload.images]
      : [];
  const finalImages =
    imageUrls.length || keptUrls.length
      ? [...keptUrls, ...imageUrls]
      : undefined;

  const result = await prisma.post.update({
    where: { id },
    data: {
      donorId: undefined,
      organizationId: payload.organizationId ?? undefined,
      postType: payload.postType ?? undefined,
      title: payload.title ?? undefined,
      ...(payload.title
        ? { slug: await uniquePostSlug(payload.title, id) }
        : {}),
      content: payload.content ?? undefined,
      visibility: payload.visibility ?? undefined,
      ...(finalImages !== undefined ? { images: finalImages } : {}),
      approvalStatus:
        user.role === "ADMIN"
          ? existing.approvalStatus
          : ApprovalStatus.PENDING,
    } as Prisma.PostUncheckedUpdateInput,
    include: {
      donor: { omit: { password: true }, include: { bloodGroup: true } },
      organization: true,
    },
  });

  return result;
};

const getOrgManagerContext = async (user: IJWTPayload) => {
  if (user.role === Role.ADMIN)
    return { organizationId: null as string | null, isAdmin: true };

  const donor = await getRequesterDonor(user);
  const membership = await prisma.organizationMember.findFirst({
    where: {
      donorId: donor.id,
      status: OrganizationMemberStatus.ACTIVE,
      isDeleted: false,
    },
    include: { position: { select: { level: true } } },
  });

  if (!membership?.organizationId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not an active organization member",
    );
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

  return { organizationId: membership.organizationId, isAdmin: false };
};

const assertCanModeratePost = async (
  user: IJWTPayload,
  postId: string,
): Promise<void> => {
  const ctx = await getOrgManagerContext(user);
  if (ctx.isAdmin) return;

  const post = await prisma.post.findUnique({
    where: { id: postId, isDeleted: false },
    select: { organizationId: true, donorId: true },
  });
  if (!post) throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");

  if (post.organizationId === ctx.organizationId) return;

  const memberDonor = await prisma.organizationMember.findFirst({
    where: {
      organizationId: ctx.organizationId!,
      donorId: post.donorId,
      isDeleted: false,
    },
  });

  if (!memberDonor) {
    throw new ApiError(httpStatus.FORBIDDEN, "You cannot moderate this post");
  }
};

const getAllPostsForOrganization = async (
  user: IJWTPayload,
  params: Record<string, unknown>,
  options: Record<string, unknown>,
) => {
  const ctx = await getOrgManagerContext(user);
  const orgId =
    ctx.isAdmin && params.organizationId
      ? String(params.organizationId)
      : ctx.organizationId;

  if (!orgId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Organization context is required",
    );
  }

  const memberRows = await prisma.organizationMember.findMany({
    where: { organizationId: orgId, isDeleted: false },
    select: { donorId: true },
  });
  const memberDonorIds = memberRows.map((m) => m.donorId);

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, organizationId: _org, ...filterData } = params as Record<string, string | undefined>;

  const andConditions: Prisma.PostWhereInput[] = [
    { isDeleted: false },
    {
      OR: [
        { organizationId: orgId },
        ...(memberDonorIds.length ? [{ donorId: { in: memberDonorIds } }] : []),
      ],
    },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: postSearchableFields.map((field) => ({
        [field]: { contains: String(searchTerm), mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: coerceFilterValue(
            key,
            (filterData as Record<string, unknown>)[key],
          ),
        },
      })),
    });
  }

  const whereConditions: Prisma.PostWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      where: whereConditions,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        donor: { omit: { password: true }, include: { bloodGroup: true } },
        organization: true,
      },
    }),
    prisma.post.count({ where: whereConditions }),
  ]);

  return { meta: { page, limit, total }, data: result };
};

const updatePostApprovalForOrganization = async (
  user: IJWTPayload,
  id: string,
  payload: { approvalStatus?: ApprovalStatus; isWork?: boolean },
) => {
  await assertCanModeratePost(user, id);
  return updatePostAdminFields(id, payload);
};

const updatePostAdminFields = async (
  id: string,
  payload: { approvalStatus?: ApprovalStatus; isWork?: boolean },
) => {
  const existing = await prisma.post.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");

  return prisma.post.update({
    where: { id },
    data: {
      ...(payload.approvalStatus
        ? { approvalStatus: payload.approvalStatus }
        : {}),
      ...(payload.isWork !== undefined ? { isWork: payload.isWork } : {}),
    },
  });
};

const deletePost = async (user: IJWTPayload, id: string) => {
  const donor = await getRequesterDonor(user);

  const existing = await prisma.post.findUnique({
    where: { id, isDeleted: false },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Post not found!");

  if (user.role !== "ADMIN" && existing.donorId !== donor.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to delete this post!",
    );
  }

  return prisma.post.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date() },
  });
};

export const PostService = {
  createPost,
  getHomepagePosts,
  getPostEligibility,
  getMyPosts,
  getMyPostBySlug,
  getAllPosts,
  getAllPostsForOrganization,
  getSinglePost,
  getPostBySlug,
  getPostComments,
  createPostComment,
  togglePostLike,
  updatePost,
  updatePostAdminFields,
  updatePostApprovalForOrganization,
  deletePost,
};
