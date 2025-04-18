import express from "express";
import upload from "../middleware/upload";
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
  getserviceDetails,
} from "../controllers/admin/ServiceController";
import {
  createActualServiceController,
  getActualServiceController,
  updateActualServiceController,
  deleteActualServiceController,
  getAllServiceController,
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
import { authorizeRoles, isAuthenticated } from "../middleware/authorised";

const router = express.Router();
router.get(
  "/get-all-service",
  (req, res, next) => {
    console.log("in Service");
    next();
  },
  getAllServiceController
);
router.post(
  "/create-category",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.array("categoryImages"),
  createCategory
);
router.get(
  "/get-category/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  getCategory
);
router.get(
  "/get-all-categories",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCategories
);
router.put(
  "/update-category/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.array("categoryImages"),
  updateCategory
);
router.delete(
  "/delete-category/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCategory
);

router.post(
  "/create-service",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.array("serviceImages"),
  createServiceController
);
router.get("/service", getServiceController);

router.get("/service/:id", getserviceDetails);
router.put(
  "/service/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  upload.array("serviceImages"),
  updateServiceController
);
router.delete("/service/:id", isAuthenticated, deleteServiceController);

router.post(
  "/create-actual-service",
  upload.array("actualServiceImages"),
  (req, res, next) => {
    console.log("called you and checking value and said this", req.body);
    next();
  },
  createActualServiceController
);
router.get("/actual-service/:id", getActualServiceController);
router.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateActualServiceController
);
router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteActualServiceController
);

router.post(
  "/create-option",
  (req, res, next) => {
    console.log("hello");
    next();
  },
  upload.array("serviceOptionImages"),
  (req, res, next) => {
    console.log("hello again");
    next();
  },
  createServiceOptionController
);
router.get("/service-option/:id", isAuthenticated, getServiceOptionController);
router.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateServiceOptionController
);
router.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteServiceOptionController
);

// Create a new FAQ category with FAQs
router.post(
  "/faqs",
  isAuthenticated,
  authorizeRoles("admin"),
  createFaqController
);

// Get all FAQ categories and their questions
router.get(
  "/faqs",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllFaqsController
);

// Get FAQs by category
router.get(
  "/faqs/:category",
  isAuthenticated,
  authorizeRoles("admin"),
  getFaqsByCategoryController
);

// Add a new FAQ to an existing category
router.post(
  "/faqs/:category",
  isAuthenticated,
  authorizeRoles("admin"),
  addFaqToCategoryController
);

// Update an existing FAQ in a category
router.put(
  "/faqs/:category/:question",
  isAuthenticated,
  authorizeRoles("admin"),
  updateFaqController
);

// Delete a specific FAQ from a category
router.delete(
  "/faqs/:category/:question",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteFaqController
);

// Delete an entire FAQ category
router.delete(
  "/faqs/:category",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCategoryController
);
export default router;
