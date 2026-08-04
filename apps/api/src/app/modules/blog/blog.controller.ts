import httpStatus from "http-status";
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../shared/pick";
import { IJWTPayload } from "../../types";
import { BlogService } from "./blog.service";
import { blogFilterableFields } from "./blog.constant";

const createBlog = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BlogService.createBlog(
      req.user as IJWTPayload,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Blog created successfully!",
      data: result,
    });
  },
);

const getAllBlogsPublic = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await BlogService.getAllBlogs(filters, options, true);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getAllBlogsAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, blogFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await BlogService.getAllBlogs(filters, options, false);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blogs retrieved successfully!",
    data: result.data,
    meta: result.meta,
  });
});

const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getBlogBySlug(req.params.slug, true);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully!",
    data: result,
  });
});

const getSingleBlogPublic = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getSingleBlog(req.params.id, true);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully!",
    data: result,
  });
});

const getSingleBlogAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.getSingleBlog(req.params.id, false);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog retrieved successfully!",
    data: result,
  });
});

const updateBlog = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BlogService.updateBlog(
      req.user as IJWTPayload,
      req.params.id,
      req.body,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog updated successfully!",
      data: result,
    });
  },
);

const updateBlogStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogService.updateBlogStatus(
    req.params.id,
    req.body.status,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog status updated successfully!",
    data: result,
  });
});

const deleteBlog = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const result = await BlogService.deleteBlog(
      req.user as IJWTPayload,
      req.params.id,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Blog deleted successfully!",
      data: result,
    });
  },
);

const incrementReadCount = catchAsync(async (req: Request, res: Response) => {
  await BlogService.incrementReadCount(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Blog read count updated.",
    data: null,
  });
});

export const BlogController = {
  createBlog,
  getAllBlogsPublic,
  getAllBlogsAdmin,
  getBlogBySlug,
  getSingleBlogPublic,
  getSingleBlogAdmin,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
  incrementReadCount,
};
