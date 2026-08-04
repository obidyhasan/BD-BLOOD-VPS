import { Router } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { multerUpload } from "../../config/multer.config";
import validateRequest from "../../middlewares/validateRequest";
import {
  adminUpdateUserZodSchema,
  createUserZodSchema,
  updateUserZodSchema,
} from "./user.validation";

const router = Router();

router.get("/me", auth(Role.ADMIN, Role.DONOR), UserController.getMyProfile);

// Public donor directory (verified + available only)
router.get("/public/donors", UserController.getPublicDonors);
router.get("/public/donors/by-slug/:slug", UserController.getPublicDonorBySlug);
router.get("/public/donors/:id", UserController.getPublicDonorById);

// Admin user management
router.get("/", auth(Role.ADMIN), UserController.getAllUsers);
router.get("/admin/by-id/:id", auth(Role.ADMIN), UserController.getUserById);
router.patch(
  "/admin/by-id/:id",
  auth(Role.ADMIN),
  validateRequest(adminUpdateUserZodSchema),
  UserController.adminUpdateUserById,
);

router.get(
  "/:email",
  auth(Role.ADMIN, Role.DONOR),
  UserController.getSingleUser,
);

router.post(
  "/create",
  validateRequest(createUserZodSchema),
  UserController.createUser,
);

router.patch(
  "/update",
  auth(Role.ADMIN, Role.DONOR),
  multerUpload.single("file"),
  validateRequest(updateUserZodSchema),
  UserController.updateMyProfile,
);

router.delete(
  "/delete",
  auth(Role.ADMIN, Role.DONOR),
  UserController.deleteUser,
);

export const UserRouter = router;
