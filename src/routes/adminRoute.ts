import express from "express";
import upload from "../middleware/upload";
import { apiLimiter } from "../middleware/rateLimiter";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategory,
  updateCategory,
} from "../controllers/admin/CategoryController";
import {
  createServiceController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
} from "../controllers/admin/ServiceController";
import {
  createActualServiceController,
  getActualServiceController,
  updateActualServiceController,
  deleteActualServiceController,
} from "../controllers/admin/actualServiceController";
import {
  createServiceOptionController,
  getServiceOptionController,
  updateServiceOptionController,
  deleteServiceOptionController,
} from "../controllers/admin/serviceOptionController";

import {
  createFaqController,
  getAllFaqsController,
  getFaqsByCategoryController,
  addFaqToCategoryController,
  updateFaqController,
  deleteFaqController,
  deleteCategoryController,
} from "../controllers/admin/faqController";

const router = express.Router();

router.use(apiLimiter);

router.post("/create-category", upload.array("categoryImages"), createCategory);
router.get("/get-category/:id", getCategory);
router.get("/get-all-categories", getAllCategories);
router.put(
  "/update-category/:id",
  upload.array("categoryImages"),
  updateCategory
);
router.delete("/delete-category/:id", deleteCategory);

router.post(
  "/create-service",
  upload.array("serviceImages"),
  createServiceController
);
router.get("/service/:id", getServiceController);
router.put(
  "/service/:id",
  upload.array("serviceImages"),
  updateServiceController
);
router.delete("/service/:id", deleteServiceController);

router.post(
  "/create-actual-service",
  upload.array("actualServiceImages"),
  createActualServiceController
);
router.get("/:id", getActualServiceController);
router.put("/update/:id", updateActualServiceController);
router.delete("/delete/:id", deleteActualServiceController);

router.post(
  "/create-option",
  upload.array("serviceOptionImages"),
  createServiceOptionController
);
router.get("/:id", getServiceOptionController);
router.put("/update/:id", updateServiceOptionController);
router.delete("/delete/:id", deleteServiceOptionController);

// Create a new FAQ category with FAQs
router.post("/faqs", createFaqController);

// Get all FAQ categories and their questions
router.get("/faqs", getAllFaqsController);

// Get FAQs by category
router.get("/faqs/:category", getFaqsByCategoryController);

// Add a new FAQ to an existing category
router.post("/faqs/:category", addFaqToCategoryController);

// Update an existing FAQ in a category
router.put("/faqs/:category/:question", updateFaqController);

// Delete a specific FAQ from a category
router.delete("/faqs/:category/:question", deleteFaqController);

// Delete an entire FAQ category
router.delete("/faqs/:category", deleteCategoryController);

export default router;
