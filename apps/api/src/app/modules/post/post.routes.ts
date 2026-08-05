import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { multerUpload } from "../../config/multer.config";
import { PostController } from "./post.controller";
import {
  createPostCommentZodSchema,
  createPostZodSchema,
  updatePostApprovalZodSchema,
  updatePostZodSchema,
} from "./post.validation";

const router = Router();

// Admin moderation endpoints (must come before "/:id")
router.get("/admin/all", auth(Role.ADMIN), PostController.getAllPostsAdmin);
router.get("/admin/:id", auth(Role.ADMIN), PostController.getSinglePostAdmin);

router.patch(
  "/admin/:id/approval",
  auth(Role.ADMIN),
  validateRequest(updatePostApprovalZodSchema),
  PostController.updatePostApproval,
);

router.get(
  "/org/all",
  auth(Role.ADMIN, Role.DONOR),
  PostController.getAllPostsOrg,
);

router.patch(
  "/org/:id/approval",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updatePostApprovalZodSchema),
  PostController.updatePostApprovalOrg,
);

router.get(
  "/post-eligibility",
  auth(Role.ADMIN, Role.DONOR),
  PostController.getPostEligibility,
);
router.get("/my", auth(Role.ADMIN, Role.DONOR), PostController.getMyPosts);
router.get(
  "/my/by-slug/:slug",
  auth(Role.ADMIN, Role.DONOR),
  PostController.getMyPostBySlug,
);

// Public feed (approved only)
router.get("/", PostController.getAllPostsPublic);
router.get("/by-slug/:slug", PostController.getPostBySlug);
router.get("/:id/comments", PostController.getPostComments);
router.post(
  "/:id/comments",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(createPostCommentZodSchema),
  PostController.createPostComment,
);
router.post(
  "/:id/like",
  auth(Role.ADMIN, Role.DONOR),
  PostController.togglePostLike,
);
router.get("/:id", PostController.getSinglePostPublic);

// Create/update with optional images upload
router.post(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  multerUpload.array("files", 10),
  validateRequest(createPostZodSchema),
  PostController.createPost,
);

router.patch(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  multerUpload.array("files", 10),
  validateRequest(updatePostZodSchema),
  PostController.updatePost,
);

router.delete("/:id", auth(Role.ADMIN, Role.DONOR), PostController.deletePost);

export const PostRoutes = router;
