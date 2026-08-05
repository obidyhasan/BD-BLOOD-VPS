import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { PostService } from "./post.service";
import { postFilterableFields } from "./post.constant";

const createPost = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const imageUrls = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map((f) => f.path)
      : [];

    const result = await PostService.createPost(
      req.user as IJWTPayload,
      req.body,
      imageUrls,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Post created successfully!",
      data: result,
    });
  },
);

const getPostEligibility = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.getPostEligibility(
      req.user as IJWTPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Donation post eligibility retrieved successfully!",
      data: result,
    });
  },
);

const getMyPosts = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const filters = pick(req.query, postFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await PostService.getMyPosts(
      req.user as IJWTPayload,
      filters,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Posts retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getMyPostBySlug = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.getMyPostBySlug(
      req.user as IJWTPayload,
      req.params.slug,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Post retrieved successfully!",
      data: result,
    });
  },
);

const getAllPostsPublic = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, postFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await PostService.getAllPosts(filters, options, true);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getAllPostsAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, postFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await PostService.getAllPosts(filters, options, false);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Posts retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getPostComments = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getPostComments(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments retrieved successfully!",
    data: result,
  });
});

const createPostComment = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.createPostComment(
      req.user as IJWTPayload,
      req.params.id,
      req.body.content,
      req.body.parentId,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Comment added successfully!",
      data: result,
    });
  },
);

const togglePostLike = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.togglePostLike(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Post like updated!",
      data: result,
    });
  },
);

const getPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getPostBySlug(req.params.slug);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post retrieved successfully!",
    data: result,
  });
});

const getSinglePostPublic = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getSinglePost(req.params.id, true);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post retrieved successfully!",
    data: result,
  });
});

const getSinglePostAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getSinglePost(req.params.id, false);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post retrieved successfully!",
    data: result,
  });
});

const updatePost = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const imageUrls = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[]).map((f) => f.path)
      : [];

    const result = await PostService.updatePost(
      req.user as IJWTPayload,
      req.params.id,
      req.body,
      imageUrls,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Post updated successfully!",
      data: result,
    });
  },
);

const updatePostApproval = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.updatePostAdminFields(req.params.id, {
    approvalStatus: req.body.approvalStatus,
    isWork: req.body.isWork,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post approval updated successfully!",
    data: result,
  });
});

const getAllPostsOrg = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const filters = pick(req.query, postFilterableFields);
    const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

    const result = await PostService.getAllPostsForOrganization(
      req.user as IJWTPayload,
      filters,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Organization posts retrieved successfully!",
      data: result.data,
      meta: result.meta,
    });
  },
);

const updatePostApprovalOrg = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.updatePostApprovalForOrganization(
      req.user as IJWTPayload,
      req.params.id,
      {
        approvalStatus: req.body.approvalStatus,
        isWork: req.body.isWork,
      },
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Post approval updated successfully!",
      data: result,
    });
  },
);

const deletePost = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await PostService.deletePost(
      req.user as IJWTPayload,
      req.params.id,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Post deleted successfully!",
      data: result,
    });
  },
);

export const PostController = {
  createPost,
  getPostEligibility,
  getMyPosts,
  getMyPostBySlug,
  getAllPostsPublic,
  getAllPostsAdmin,
  getAllPostsOrg,
  getPostBySlug,
  getPostComments,
  createPostComment,
  togglePostLike,
  getSinglePostPublic,
  getSinglePostAdmin,
  updatePost,
  updatePostApproval,
  updatePostApprovalOrg,
  deletePost,
};
