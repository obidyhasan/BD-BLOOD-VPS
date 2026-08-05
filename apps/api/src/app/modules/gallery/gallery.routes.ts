import { Router } from "express";
import { Role } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { GalleryController } from "./gallery.controller";
import {
  createGalleryZodSchema,
  updateGalleryZodSchema,
} from "./gallery.validation";

const router = Router();

router.get("/", GalleryController.getAllGalleries);
router.get(
  "/manage",
  auth(Role.ADMIN, Role.DONOR),
  GalleryController.getManagedGalleries,
);
router.get("/by-slug/:slug", GalleryController.getGalleryBySlug);
router.get("/:id", GalleryController.getSingleGallery);

router.post(
  "/",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(createGalleryZodSchema),
  GalleryController.createGallery,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  validateRequest(updateGalleryZodSchema),
  GalleryController.updateGallery,
);
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.DONOR),
  GalleryController.deleteGallery,
);

export const GalleryRoutes = router;
