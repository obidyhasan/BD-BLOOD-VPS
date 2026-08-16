import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { BlogController } from "./blog.controller";
import {
  createBlogZodSchema,
  updateBlogStatusZodSchema,
  updateBlogZodSchema,
} from "./blog.validation";

const router = Router();

// Admin moderation (must come before "/:id")
router.get("/admin/all", auth(Role.ADMIN), BlogController.getAllBlogsAdmin);
router.get("/admin/:id", auth(Role.ADMIN), BlogController.getSingleBlogAdmin);
router.patch(
  "/admin/:id/status",
  auth(Role.ADMIN),
  validateRequest(updateBlogStatusZodSchema),
  BlogController.updateBlogStatus,
);
router.get(
  "/manage",
  auth(Role.ADMIN, Role.DONOR),
  BlogController.getManagedBlogs,
);

// Public
router.get("/", BlogController.getAllBlogsPublic);
router.get("/by-slug/:slug", BlogController.getBlogBySlug);
router.get("/:id", BlogController.getSingleBlogPublic);
router.post("/:id/read", BlogController.incrementReadCount);

// Admin-managed Education & Stories content
router.post(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(createBlogZodSchema),
  BlogController.createBlog,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateBlogZodSchema),
  BlogController.updateBlog,
);
router.delete("/:id", auth(Role.ADMIN, Role.DONOR), BlogController.deleteBlog);

export const BlogRoutes = router;
