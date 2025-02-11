import express from "express";
import upload from "../middleware/upload";
import { createCategory, deleteCategory, getAllCategories, getCategory, updateCategory } from "../controllers/admin/CategoryController";
import {
  createServiceController,
  getServiceController,
  updateServiceController,
  deleteServiceController,
} from "../controllers/admin/ServiceController";
import { createActualServiceController, getActualServiceController, updateActualServiceController, deleteActualServiceController } from "../controllers/admin/actualServiceController"
import {
  createServiceOptionController,
  getServiceOptionController,
  updateServiceOptionController,
  deleteServiceOptionController,
} from "../controllers/admin/serviceOptionController";


const router = express.Router();

router.post("/create-category", upload.array("categoryImages"), createCategory);
router.get("/get-category/:id", getCategory);
router.get("/get-all-categories", getAllCategories);
router.put("/update-category/:id", upload.array("categoryImages"), updateCategory);
router.delete("/delete-category/:id", deleteCategory)

router.post("/create-service", upload.array("serviceImages"), createServiceController);
router.get("/service/:id", getServiceController);
router.put("/service/:id", upload.array("serviceImages"), updateServiceController);
router.delete("/service/:id", deleteServiceController);

router.post("/create-actual-service", upload.array("actualServiceImages"), createActualServiceController);
router.get("/:id", getActualServiceController);
router.put("/update/:id", updateActualServiceController);
router.delete("/delete/:id", deleteActualServiceController);

router.post("/create-option", upload.array("serviceOptionImages"), createServiceOptionController);
router.get("/:id", getServiceOptionController);
router.put("/update/:id", updateServiceOptionController);
router.delete("/delete/:id", deleteServiceOptionController);


export default router;

